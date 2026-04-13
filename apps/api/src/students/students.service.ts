import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  IdentityTrack,
  Prisma,
  StudentLifecycleStatus,
} from '@prisma/client';
import { businessError } from '../common/errors/business-error';
import { resolvePagination } from '../common/pagination/resolve-pagination';
import { PrismaService } from '../prisma/prisma.service';
import { GuardiansService } from '../guardians/guardians.service';
import { ageInYears } from './age-utils';
import { AddGuardianLinkDto } from './dto/add-guardian-link.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { ListStudentsQueryDto } from './dto/list-students-query.dto';
import { PatchGuardianLinkDto } from './dto/patch-guardian-link.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import {
  buildStudentLegalIdentityKey,
  isValidCpfDigits,
  normalizeCpfDigits,
} from './legal-identity';

const MAJORITY_AGE = 18;
const MIN_AGE_STUDENT_MARITAL_STATUS = 18;

const studentDetailInclude = {
  guardianLinks: {
    orderBy: { displayOrder: 'asc' as const },
    include: { guardian: true },
  },
  addressSourceLink: {
    include: { guardian: true },
  },
} satisfies Prisma.StudentInclude;

type StudentWithDetail = Prisma.StudentGetPayload<{
  include: typeof studentDetailInclude;
}>;

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly guardians: GuardiansService,
  ) {}

  async list(query: ListStudentsQueryDto) {
    const { limit, offset } = resolvePagination(query.limit, query.offset);
    const q = query.q?.trim();
    const where: Prisma.StudentWhereInput = q
      ? { OR: this.buildStudentSearchOr(q) }
      : {};
    const [total, data] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: offset,
        take: limit,
        include: {
          guardianLinks: {
            take: 3,
            orderBy: { displayOrder: 'asc' },
            include: {
              guardian: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);
    return { data, meta: { total, limit, offset } };
  }

  async getById(id: string): Promise<StudentWithDetail> {
    const s = await this.prisma.student.findUnique({
      where: { id },
      include: studentDetailInclude,
    });
    if (!s) {
      throw new NotFoundException(
        businessError('NOT_FOUND', { message: 'Aluno não encontrado.' }),
      );
    }
    return s;
  }

  async create(dto: CreateStudentDto) {
    const identity = this.resolveStudentIdentity(dto);
    const existing = await this.prisma.student.findUnique({
      where: { legalIdentityKey: identity.legalIdentityKey },
    });
    if (existing) {
      if (existing.lifecycleStatus === StudentLifecycleStatus.COMPLETED) {
        throw new ConflictException(businessError('STUDENT_DUPLICATE_IDENTITY'));
      }
      throw new ConflictException(businessError('STUDENT_DRAFT_CONFLICT'));
    }
    try {
      return await this.prisma.student.create({
        data: {
          legalIdentityKey: identity.legalIdentityKey,
          identityTrack: dto.identityTrack,
          cpf: identity.cpf,
          identityDocumentType: identity.identityDocumentType,
          identityDocumentNumber: identity.identityDocumentNumber,
          identityIssuingCountry: identity.identityIssuingCountry,
          name: dto.name.trim(),
          birthDate: new Date(dto.birthDate),
          sex: dto.sex ?? undefined,
          nationality: dto.nationality?.trim() || undefined,
          rg: dto.rg?.trim() || undefined,
          email: dto.email?.trim() || undefined,
          phone: dto.phone?.trim() || undefined,
          naturalCity: dto.naturalCity?.trim() || undefined,
          naturalState: dto.naturalState?.trim() || undefined,
          imageUsageAuthorized: dto.imageUsageAuthorized,
        },
        include: studentDetailInclude,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(businessError('STUDENT_DUPLICATE_IDENTITY'));
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateStudentDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(businessError('VALIDATION_PATCH_EMPTY'));
    }
    const current = await this.getById(id);
    const birthForAge = dto.birthDate
      ? new Date(dto.birthDate)
      : current.birthDate;
    const age = ageInYears(birthForAge);
    if (
      dto.maritalStatus !== undefined &&
      age < MIN_AGE_STUDENT_MARITAL_STATUS
    ) {
      throw new BadRequestException(
        businessError('VALIDATION_ERROR', {
          message:
            'Estado civil do aluno só pode ser informado a partir da idade mínima configurada.',
        }),
      );
    }
    if (dto.addressSourceLinkId !== undefined) {
      await this.applyAddressSourceLink(id, dto.addressSourceLinkId);
    }
    const data = this.buildStudentPatchData(dto);
    if (Object.keys(data).length === 0) {
      return this.getById(id);
    }
    return this.prisma.student.update({
      where: { id },
      data,
      include: studentDetailInclude,
    });
  }

  async complete(id: string) {
    const student = await this.getById(id);
    if (student.lifecycleStatus === StudentLifecycleStatus.COMPLETED) {
      return student;
    }
    this.assertStudentCompletable(student);
    return this.prisma.student.update({
      where: { id },
      data: { lifecycleStatus: StudentLifecycleStatus.COMPLETED },
      include: studentDetailInclude,
    });
  }

  async delete(
    id: string,
    opts: { confirmHeader: string | undefined; deleteOrphanGuardians?: boolean },
  ) {
    if (opts.confirmHeader !== '1') {
      throw new BadRequestException(
        businessError('STUDENT_DELETE_CONFIRMATION_REQUIRED'),
      );
    }
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { guardianLinks: { select: { guardianId: true } } },
    });
    if (!student) {
      throw new NotFoundException(
        businessError('NOT_FOUND', { message: 'Aluno não encontrado.' }),
      );
    }
    const enrollments = await this.prisma.enrollment.count({
      where: { studentId: id },
    });
    if (enrollments > 0) {
      throw new ConflictException(businessError('STUDENT_HAS_ENROLLMENTS'));
    }
    const guardianIds = [
      ...new Set(student.guardianLinks.map((l) => l.guardianId)),
    ];
    await this.prisma.$transaction(async (tx) => {
      await tx.student.delete({ where: { id } });
      if (opts.deleteOrphanGuardians) {
        for (const gid of guardianIds) {
          const remaining = await tx.studentGuardianLink.count({
            where: { guardianId: gid },
          });
          if (remaining === 0) {
            await tx.guardian.delete({ where: { id: gid } });
          }
        }
      }
    });
  }

  async addGuardianLink(studentId: string, dto: AddGuardianLinkDto) {
    await this.getById(studentId);
    const guardian = await this.guardians.requireById(dto.guardianId);
    if (
      dto.isAddressSource &&
      !this.rowGuardianAddressComplete(guardian)
    ) {
      throw new BadRequestException(
        businessError('STUDENT_ADDRESS_SOURCE_GUARDIAN_ADDRESS_INCOMPLETE'),
      );
    }
    try {
      const link = await this.prisma.$transaction(async (tx) => {
        const created = await tx.studentGuardianLink.create({
          data: {
            studentId,
            guardianId: dto.guardianId,
            relationshipType: dto.relationshipType,
            isFinancialResponsible: dto.isFinancialResponsible,
            displayOrder: dto.displayOrder ?? 0,
            isAddressSource: dto.isAddressSource ?? false,
          },
        });
        if (dto.isAddressSource) {
          await this.clearAddressSourceFlagsTx(tx, studentId, created.id);
          await tx.studentGuardianLink.update({
            where: { id: created.id },
            data: { isAddressSource: true },
          });
          await tx.student.update({
            where: { id: studentId },
            data: { addressSourceLink: { connect: { id: created.id } } },
          });
        }
        return created;
      });
      return this.getGuardianLinkOrThrow(studentId, link.id);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(businessError('GUARDIAN_LINK_DUPLICATE'));
      }
      throw e;
    }
  }

  async patchGuardianLink(
    studentId: string,
    linkId: string,
    dto: PatchGuardianLinkDto,
  ) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(businessError('VALIDATION_PATCH_EMPTY'));
    }
    const link = await this.getGuardianLinkOrThrow(studentId, linkId);
    if (dto.isAddressSource === true) {
      if (!this.rowGuardianAddressComplete(link.guardian)) {
        throw new BadRequestException(
          businessError('STUDENT_ADDRESS_SOURCE_GUARDIAN_ADDRESS_INCOMPLETE'),
        );
      }
    }
    await this.prisma.$transaction(async (tx) => {
      if (dto.isAddressSource === true) {
        await this.clearAddressSourceFlagsTx(tx, studentId, linkId);
      }
      await tx.studentGuardianLink.update({
        where: { id: linkId },
        data: {
          ...(dto.relationshipType !== undefined
            ? { relationshipType: dto.relationshipType }
            : {}),
          ...(dto.isFinancialResponsible !== undefined
            ? { isFinancialResponsible: dto.isFinancialResponsible }
            : {}),
          ...(dto.displayOrder !== undefined
            ? { displayOrder: dto.displayOrder }
            : {}),
          ...(dto.isAddressSource !== undefined
            ? { isAddressSource: dto.isAddressSource }
            : {}),
        },
      });
      if (dto.isAddressSource === true) {
        await tx.student.update({
          where: { id: studentId },
          data: { addressSourceLink: { connect: { id: linkId } } },
        });
      }
      if (dto.isAddressSource === false && link.isAddressSource) {
        await tx.student.update({
          where: { id: studentId },
          data: { addressSourceLink: { disconnect: true } },
        });
      }
    });
    return this.getGuardianLinkOrThrow(studentId, linkId);
  }

  async removeGuardianLink(studentId: string, linkId: string) {
    await this.getGuardianLinkOrThrow(studentId, linkId);
    await this.prisma.$transaction(async (tx) => {
      const s = await tx.student.findUnique({
        where: { id: studentId },
        select: { addressSourceLinkId: true },
      });
      if (s?.addressSourceLinkId === linkId) {
        await tx.student.update({
          where: { id: studentId },
          data: { addressSourceLink: { disconnect: true } },
        });
      }
      await tx.studentGuardianLink.delete({ where: { id: linkId } });
    });
  }

  private async getGuardianLinkOrThrow(studentId: string, linkId: string) {
    const row = await this.prisma.studentGuardianLink.findFirst({
      where: { id: linkId, studentId },
      include: { guardian: true },
    });
    if (!row) {
      throw new NotFoundException(businessError('GUARDIAN_LINK_NOT_FOUND'));
    }
    return row;
  }

  private async clearAddressSourceFlagsTx(
    tx: Prisma.TransactionClient,
    studentId: string,
    exceptLinkId: string,
  ) {
    await tx.studentGuardianLink.updateMany({
      where: { studentId, id: { not: exceptLinkId } },
      data: { isAddressSource: false },
    });
  }

  private async applyAddressSourceLink(studentId: string, value: string | null) {
    if (value === null) {
      await this.prisma.$transaction(async (tx) => {
        await tx.studentGuardianLink.updateMany({
          where: { studentId },
          data: { isAddressSource: false },
        });
        await tx.student.update({
          where: { id: studentId },
          data: { addressSourceLink: { disconnect: true } },
        });
      });
      return;
    }
    const link = await this.prisma.studentGuardianLink.findFirst({
      where: { id: value, studentId },
      include: { guardian: true },
    });
    if (!link) {
      throw new BadRequestException(
        businessError('STUDENT_ADDRESS_SOURCE_INVALID'),
      );
    }
    if (!this.rowGuardianAddressComplete(link.guardian)) {
      throw new BadRequestException(
        businessError('STUDENT_ADDRESS_SOURCE_GUARDIAN_ADDRESS_INCOMPLETE'),
      );
    }
    await this.prisma.$transaction(async (tx) => {
      await this.clearAddressSourceFlagsTx(tx, studentId, link.id);
      await tx.studentGuardianLink.update({
        where: { id: link.id },
        data: { isAddressSource: true },
      });
      await tx.student.update({
        where: { id: studentId },
        data: { addressSourceLink: { connect: { id: link.id } } },
      });
    });
  }

  private buildStudentPatchData(dto: UpdateStudentDto): Prisma.StudentUpdateInput {
    const data: Prisma.StudentUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }
    if (dto.birthDate !== undefined) {
      data.birthDate = new Date(dto.birthDate);
    }
    if (dto.sex !== undefined) {
      data.sex = dto.sex;
    }
    if (dto.nationality !== undefined) {
      data.nationality = dto.nationality?.trim() || null;
    }
    if (dto.rg !== undefined) {
      data.rg = dto.rg?.trim() || null;
    }
    if (dto.email !== undefined) {
      data.email = dto.email?.trim() || null;
    }
    if (dto.phone !== undefined) {
      data.phone = dto.phone?.trim() || null;
    }
    if (dto.naturalCity !== undefined) {
      data.naturalCity = dto.naturalCity?.trim() || null;
    }
    if (dto.naturalState !== undefined) {
      data.naturalState = dto.naturalState?.trim() || null;
    }
    if (dto.imageUsageAuthorized !== undefined) {
      data.imageUsageAuthorized = dto.imageUsageAuthorized;
    }
    if (dto.maritalStatus !== undefined) {
      data.maritalStatus = dto.maritalStatus?.trim() || null;
    }
    if (dto.observations !== undefined) {
      data.observations = dto.observations?.trim() || null;
    }
    if (dto.healthNotes !== undefined) {
      data.healthNotes = dto.healthNotes?.trim() || null;
    }
    if (dto.street !== undefined) {
      data.street = dto.street?.trim() || null;
    }
    if (dto.number !== undefined) {
      data.number = dto.number?.trim() || null;
    }
    if (dto.complement !== undefined) {
      data.complement = dto.complement?.trim() || null;
    }
    if (dto.neighborhood !== undefined) {
      data.neighborhood = dto.neighborhood?.trim() || null;
    }
    if (dto.city !== undefined) {
      data.city = dto.city?.trim() || null;
    }
    if (dto.state !== undefined) {
      data.state = dto.state?.trim() || null;
    }
    if (dto.zipCode !== undefined) {
      data.zipCode = dto.zipCode?.trim() || null;
    }
    return data;
  }

  private assertStudentCompletable(s: StudentWithDetail) {
    if (!s.name?.trim()) {
      throw new BadRequestException(businessError('STUDENT_COMPLETION_INCOMPLETE'));
    }
    if (!s.sex) {
      throw new BadRequestException(businessError('STUDENT_COMPLETION_INCOMPLETE'));
    }
    if (!s.nationality?.trim()) {
      throw new BadRequestException(businessError('STUDENT_COMPLETION_INCOMPLETE'));
    }
    const age = ageInYears(s.birthDate);
    if (!this.studentAddressSatisfied(s)) {
      throw new BadRequestException(businessError('STUDENT_ADDRESS_INCOMPLETE'));
    }
    if (age < MAJORITY_AGE) {
      if (s.guardianLinks.length === 0) {
        throw new BadRequestException(
          businessError('STUDENT_GUARDIAN_REQUIRED'),
        );
      }
      const financial = s.guardianLinks.filter((l) => l.isFinancialResponsible);
      if (financial.length === 0) {
        throw new BadRequestException(
          businessError('STUDENT_FINANCIAL_GUARDIAN_REQUIRED'),
        );
      }
      for (const l of financial) {
        const prof = l.guardian.profession?.trim() ?? '';
        if (prof.length < 2) {
          throw new BadRequestException(
            businessError('STUDENT_FINANCIAL_GUARDIAN_PROFESSION_REQUIRED'),
          );
        }
        if (!this.rowGuardianAddressComplete(l.guardian)) {
          throw new BadRequestException(
            businessError('STUDENT_ADDRESS_INCOMPLETE'),
          );
        }
      }
    }
  }

  private studentAddressSatisfied(s: StudentWithDetail): boolean {
    if (s.addressSourceLinkId) {
      const link = s.addressSourceLink;
      if (!link?.guardian) {
        return false;
      }
      return this.rowGuardianAddressComplete(link.guardian);
    }
    return this.rowStudentAddressComplete(s);
  }

  private rowStudentAddressComplete(row: {
    street: string | null;
    number: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
  }): boolean {
    return [row.street, row.number, row.neighborhood, row.city, row.state, row.zipCode].every(
      (v) => v != null && String(v).trim().length > 0,
    );
  }

  private rowGuardianAddressComplete(g: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  }): boolean {
    return [g.street, g.number, g.neighborhood, g.city, g.state, g.zipCode].every(
      (v) => String(v).trim().length > 0,
    );
  }

  private buildStudentSearchOr(q: string): Prisma.StudentWhereInput[] {
    const digits = normalizeCpfDigits(q);
    const or: Prisma.StudentWhereInput[] = [
      { name: { contains: q, mode: 'insensitive' } },
      { legalIdentityKey: { contains: q, mode: 'insensitive' } },
      {
        identityDocumentNumber: {
          contains: q.trim().toUpperCase(),
          mode: 'insensitive',
        },
      },
      {
        rg: { contains: q, mode: 'insensitive' },
      },
      {
        guardianLinks: {
          some: {
            guardian: { name: { contains: q, mode: 'insensitive' } },
          },
        },
      },
    ];
    if (digits.length === 11) {
      or.push({ cpf: digits });
    } else if (digits.length >= 3) {
      or.push({ cpf: { startsWith: digits } });
    }
    return or;
  }

  private resolveStudentIdentity(dto: CreateStudentDto): {
    legalIdentityKey: string;
    cpf: string | null;
    identityDocumentType: string | null;
    identityDocumentNumber: string | null;
    identityIssuingCountry: string | null;
  } {
    if (dto.identityTrack === IdentityTrack.CPF) {
      const cpfDigits = normalizeCpfDigits(dto.cpf);
      if (!cpfDigits || cpfDigits.length !== 11) {
        throw new BadRequestException(businessError('INVALID_CPF'));
      }
      if (!isValidCpfDigits(cpfDigits)) {
        throw new BadRequestException(businessError('INVALID_CPF'));
      }
      const legalIdentityKey = buildStudentLegalIdentityKey(
        dto.identityTrack,
        cpfDigits,
        null,
        null,
      );
      return {
        legalIdentityKey,
        cpf: cpfDigits,
        identityDocumentType: null,
        identityDocumentNumber: null,
        identityIssuingCountry: null,
      };
    }
    const t = dto.identityDocumentType?.trim();
    const n = dto.identityDocumentNumber?.trim();
    if (!t || !n) {
      throw new BadRequestException(
        businessError('VALIDATION_ERROR', {
          message: 'Documento oficial: tipo e número são obrigatórios.',
        }),
      );
    }
    const country = dto.identityIssuingCountry?.trim() || null;
    const legalIdentityKey = buildStudentLegalIdentityKey(
      dto.identityTrack,
      null,
      t,
      n,
    );
    return {
      legalIdentityKey,
      cpf: null,
      identityDocumentType: t,
      identityDocumentNumber: n,
      identityIssuingCountry: country,
    };
  }
}

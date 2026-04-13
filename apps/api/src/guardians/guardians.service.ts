import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IdentityTrack, Prisma } from '@prisma/client';
import { businessError } from '../common/errors/business-error';
import { resolvePagination } from '../common/pagination/resolve-pagination';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildGuardianLegalIdentityKey,
  isValidCpfDigits,
  normalizeCpfDigits,
} from '../students/legal-identity';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { ListGuardiansQueryDto } from './dto/list-guardians-query.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';

@Injectable()
export class GuardiansService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListGuardiansQueryDto) {
    const { limit, offset } = resolvePagination(query.limit, query.offset);
    const q = query.q?.trim();
    const where: Prisma.GuardianWhereInput = q
      ? {
          OR: this.buildSearchOr(q),
        }
      : {};
    const [total, data] = await Promise.all([
      this.prisma.guardian.count({ where }),
      this.prisma.guardian.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: offset,
        take: limit,
      }),
    ]);
    return { data, meta: { total, limit, offset } };
  }

  async getById(id: string) {
    const g = await this.prisma.guardian.findUnique({ where: { id } });
    if (!g) {
      throw new NotFoundException(businessError('GUARDIAN_NOT_FOUND'));
    }
    return g;
  }

  /** Usado por vínculos: confirma existência sem 404 “ruidoso” no fluxo interno. */
  async requireById(id: string) {
    return this.getById(id);
  }

  async create(dto: CreateGuardianDto) {
    const identity = this.resolveIdentityPayload(dto);
    try {
      return await this.prisma.guardian.create({
        data: {
          legalIdentityKey: identity.legalIdentityKey,
          identityTrack: dto.identityTrack,
          cpf: identity.cpf,
          identityDocumentType: identity.identityDocumentType,
          identityDocumentNumber: identity.identityDocumentNumber,
          identityIssuingCountry: identity.identityIssuingCountry,
          name: dto.name.trim(),
          birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
          deceased: dto.deceased,
          email: dto.email.trim(),
          phone: dto.phone.trim(),
          profession: dto.profession?.trim() || null,
          maritalStatus: dto.maritalStatus?.trim() || null,
          educationLevelNote: dto.educationLevelNote?.trim() || null,
          street: dto.street.trim(),
          number: dto.number.trim(),
          complement: dto.complement?.trim() || null,
          neighborhood: dto.neighborhood.trim(),
          city: dto.city.trim(),
          state: dto.state.trim(),
          zipCode: dto.zipCode.trim(),
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(businessError('GUARDIAN_DUPLICATE_IDENTITY'));
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateGuardianDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        businessError('VALIDATION_PATCH_EMPTY'),
      );
    }
    await this.getById(id);
    const data: Prisma.GuardianUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }
    if (dto.birthDate !== undefined) {
      data.birthDate =
        dto.birthDate === null ? null : new Date(dto.birthDate);
    }
    if (dto.deceased !== undefined) {
      data.deceased = dto.deceased;
    }
    if (dto.email !== undefined) {
      data.email = dto.email.trim();
    }
    if (dto.phone !== undefined) {
      data.phone = dto.phone.trim();
    }
    if (dto.profession !== undefined) {
      data.profession = dto.profession?.trim() || null;
    }
    if (dto.maritalStatus !== undefined) {
      data.maritalStatus = dto.maritalStatus?.trim() || null;
    }
    if (dto.educationLevelNote !== undefined) {
      data.educationLevelNote = dto.educationLevelNote?.trim() || null;
    }
    if (dto.street !== undefined) {
      data.street = dto.street.trim();
    }
    if (dto.number !== undefined) {
      data.number = dto.number.trim();
    }
    if (dto.complement !== undefined) {
      data.complement = dto.complement?.trim() || null;
    }
    if (dto.neighborhood !== undefined) {
      data.neighborhood = dto.neighborhood.trim();
    }
    if (dto.city !== undefined) {
      data.city = dto.city.trim();
    }
    if (dto.state !== undefined) {
      data.state = dto.state.trim();
    }
    if (dto.zipCode !== undefined) {
      data.zipCode = dto.zipCode.trim();
    }
    return this.prisma.guardian.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.getById(id);
    const links = await this.prisma.studentGuardianLink.count({
      where: { guardianId: id },
    });
    if (links > 0) {
      throw new ConflictException(
        businessError('GUARDIAN_HAS_STUDENT_LINKS'),
      );
    }
    await this.prisma.guardian.delete({ where: { id } });
  }

  private buildSearchOr(q: string): Prisma.GuardianWhereInput[] {
    const digits = normalizeCpfDigits(q);
    const or: Prisma.GuardianWhereInput[] = [
      { name: { contains: q, mode: 'insensitive' } },
      { legalIdentityKey: { contains: q, mode: 'insensitive' } },
      {
        identityDocumentNumber: {
          contains: q.trim().toUpperCase(),
          mode: 'insensitive',
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

  private resolveIdentityPayload(dto: CreateGuardianDto): {
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
      const legalIdentityKey = buildGuardianLegalIdentityKey(
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
      throw new BadRequestException(businessError('VALIDATION_ERROR', {
        message: 'Documento oficial: tipo e número são obrigatórios.',
      }));
    }
    const country = dto.identityIssuingCountry?.trim() || null;
    const legalIdentityKey = buildGuardianLegalIdentityKey(
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

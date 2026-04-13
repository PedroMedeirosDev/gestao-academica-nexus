import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus, GradeCreationMode, Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { businessError } from '../common/errors/business-error';
import { resolvePagination } from '../common/pagination/resolve-pagination';
import { PrismaService } from '../prisma/prisma.service';
import { AddCurriculumLineDto } from './dto/add-curriculum-line.dto';
import { CreateGradeDto } from './dto/create-grade.dto';
import { CreateSchoolClassDto } from './dto/create-school-class.dto';
import { ListGradesQueryDto } from './dto/list-grades-query.dto';
import { MaterializeFromTemplateDto } from './dto/materialize-from-template.dto';
import { PatchCurriculumSortDto } from './dto/patch-curriculum-sort.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { UpdateSchoolClassDto } from './dto/update-school-class.dto';
import { parseFixedSeriesTemplate } from './fixed-series-template';
import { normalizeCatalogLabel } from './normalize-catalog-label';

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListGradesQueryDto) {
    const { limit, offset } = resolvePagination(query.limit, query.offset);
    const where = {
      ...(query.academicYearId
        ? { academicYearId: query.academicYearId }
        : {}),
      ...(query.educationLevelId
        ? { educationLevelId: query.educationLevelId }
        : {}),
    };
    const [total, data] = await Promise.all([
      this.prisma.grade.count({ where }),
      this.prisma.grade.findMany({
        where,
        orderBy: [
          { academicYear: { year: 'desc' } },
          { educationLevel: { sortOrder: 'asc' } },
          { sortOrder: 'asc' },
          { label: 'asc' },
        ],
        include: {
          academicYear: { select: { id: true, year: true } },
          educationLevel: { select: { id: true, code: true, name: true } },
        },
        skip: offset,
        take: limit,
      }),
    ]);
    return { data, meta: { total, limit, offset } };
  }

  async getById(id: string) {
    const grade = await this.prisma.grade.findUnique({
      where: { id },
      include: {
        academicYear: { select: { id: true, year: true } },
        educationLevel: { select: { id: true, code: true, name: true } },
      },
    });
    if (!grade) {
      throw new NotFoundException(businessError('GRADE_NOT_FOUND'));
    }
    return grade;
  }

  async create(dto: CreateGradeDto) {
    const label = normalizeCatalogLabel(dto.label);
    const sortOrder = dto.sortOrder ?? 0;

    const [year, level] = await Promise.all([
      this.prisma.academicYear.findUnique({ where: { id: dto.academicYearId } }),
      this.prisma.educationLevel.findUnique({
        where: { id: dto.educationLevelId },
      }),
    ]);
    if (!year) {
      throw new NotFoundException(businessError('ACADEMIC_YEAR_NOT_FOUND'));
    }
    if (!level) {
      throw new NotFoundException(businessError('EDUCATION_LEVEL_NOT_FOUND'));
    }

    this.assertFixedSeriesGradeAllowed(level, label, sortOrder, {
      requireSortFromClientIfFixed: true,
      clientSortOrder: dto.sortOrder,
    });

    try {
      return await this.prisma.grade.create({
        data: {
          academicYearId: dto.academicYearId,
          educationLevelId: dto.educationLevelId,
          label,
          sortOrder,
        },
        include: {
          academicYear: { select: { id: true, year: true } },
          educationLevel: { select: { id: true, code: true, name: true } },
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          businessError('CATALOG_DUPLICATE_GRADE', {
            details: [
              { field: 'label', reason: 'UNIQUE' },
              { field: 'academicYearId', reason: 'UNIQUE' },
              { field: 'educationLevelId', reason: 'UNIQUE' },
            ],
          }),
        );
      }
      throw e;
    }
  }

  /**
   * `catalog.spec.md` §3 — editar rótulo/ordem; mudar ano ou nível só sem matrícula Reserva/Ativa.
   */
  async patchGrade(id: string, dto: UpdateGradeDto) {
    const existing = await this.getById(id);
    const hasPatch =
      dto.label !== undefined ||
      dto.sortOrder !== undefined ||
      dto.academicYearId !== undefined ||
      dto.educationLevelId !== undefined;
    if (!hasPatch) {
      throw new BadRequestException(
        businessError('VALIDATION_PATCH_EMPTY', {
          details: [{ field: 'body', reason: 'EMPTY' }],
        }),
      );
    }

    const movingYear =
      dto.academicYearId !== undefined &&
      dto.academicYearId !== existing.academicYearId;
    const movingLevel =
      dto.educationLevelId !== undefined &&
      dto.educationLevelId !== existing.educationLevelId;
    if (movingYear || movingLevel) {
      const blocking = await this.prisma.enrollment.count({
        where: {
          gradeId: id,
          status: {
            in: [EnrollmentStatus.RESERVATION, EnrollmentStatus.ACTIVE],
          },
        },
      });
      if (blocking > 0) {
        throw new ConflictException(
          businessError('GRADE_MOVE_BLOCKED_BY_ENROLLMENT', {
            details: [
              {
                field: 'academicYearId',
                reason: 'ENROLLMENT_RESERVATION_OR_ACTIVE',
              },
            ],
          }),
        );
      }
    }

    const nextYearId = dto.academicYearId ?? existing.academicYearId;
    const nextLevelId = dto.educationLevelId ?? existing.educationLevelId;
    const nextLabel =
      dto.label !== undefined
        ? normalizeCatalogLabel(dto.label)
        : normalizeCatalogLabel(existing.label);
    const nextSortOrder =
      dto.sortOrder !== undefined ? dto.sortOrder : existing.sortOrder;

    if (
      dto.academicYearId !== undefined &&
      dto.academicYearId !== existing.academicYearId
    ) {
      const y = await this.prisma.academicYear.findUnique({
        where: { id: nextYearId },
      });
      if (!y) {
        throw new NotFoundException(businessError('ACADEMIC_YEAR_NOT_FOUND'));
      }
    }
    if (
      dto.educationLevelId !== undefined &&
      dto.educationLevelId !== existing.educationLevelId
    ) {
      const lev = await this.prisma.educationLevel.findUnique({
        where: { id: nextLevelId },
      });
      if (!lev) {
        throw new NotFoundException(
          businessError('EDUCATION_LEVEL_NOT_FOUND'),
        );
      }
    }

    const level = await this.prisma.educationLevel.findUnique({
      where: { id: nextLevelId },
    });
    if (!level) {
      throw new NotFoundException(businessError('EDUCATION_LEVEL_NOT_FOUND'));
    }
    this.assertFixedSeriesGradeAllowed(level, nextLabel, nextSortOrder, {
      requireSortFromClientIfFixed: false,
      clientSortOrder: dto.sortOrder ?? null,
    });

    try {
      return await this.prisma.grade.update({
        where: { id },
        data: {
          ...(dto.label !== undefined ? { label: nextLabel } : {}),
          ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
          ...(dto.academicYearId !== undefined
            ? { academicYearId: dto.academicYearId }
            : {}),
          ...(dto.educationLevelId !== undefined
            ? { educationLevelId: dto.educationLevelId }
            : {}),
        },
        include: {
          academicYear: { select: { id: true, year: true } },
          educationLevel: { select: { id: true, code: true, name: true } },
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          businessError('CATALOG_DUPLICATE_GRADE', {
            details: [
              { field: 'label', reason: 'UNIQUE' },
              { field: 'academicYearId', reason: 'UNIQUE' },
              { field: 'educationLevelId', reason: 'UNIQUE' },
            ],
          }),
        );
      }
      throw e;
    }
  }

  async deleteGrade(id: string) {
    await this.getById(id);

    const [enrollments, classes, curriculum] = await Promise.all([
      this.prisma.enrollment.count({ where: { gradeId: id } }),
      this.prisma.schoolClass.count({ where: { gradeId: id } }),
      this.prisma.gradeCurriculum.count({ where: { gradeId: id } }),
    ]);

    if (enrollments + classes + curriculum > 0) {
      throw new ConflictException(
        businessError('CATALOG_DEPENDENCY_GRADE_DELETE', {
          details: [
            ...(enrollments > 0
              ? [{ field: 'enrollments', reason: 'EXISTS' as const }]
              : []),
            ...(classes > 0
              ? [{ field: 'schoolClasses', reason: 'EXISTS' as const }]
              : []),
            ...(curriculum > 0
              ? [{ field: 'curriculum', reason: 'EXISTS' as const }]
              : []),
          ],
        }),
      );
    }

    await this.prisma.grade.delete({ where: { id } });
    return { deleted: true, id };
  }

  async listCurriculum(gradeId: string, query: PaginationQueryDto) {
    await this.getById(gradeId);
    const { limit, offset } = resolvePagination(query.limit, query.offset);
    const where = { gradeId };
    const [total, data] = await Promise.all([
      this.prisma.gradeCurriculum.count({ where }),
      this.prisma.gradeCurriculum.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        include: { discipline: true },
        skip: offset,
        take: limit,
      }),
    ]);
    return { data, meta: { total, limit, offset } };
  }

  async addCurriculumLine(gradeId: string, dto: AddCurriculumLineDto) {
    await this.getById(gradeId);

    const discipline = await this.prisma.discipline.findUnique({
      where: { id: dto.disciplineId },
    });
    if (!discipline) {
      throw new NotFoundException(businessError('DISCIPLINE_NOT_FOUND'));
    }

    try {
      return await this.prisma.gradeCurriculum.create({
        data: {
          gradeId,
          disciplineId: dto.disciplineId,
          sortOrder: dto.sortOrder,
        },
        include: { discipline: true },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          businessError('CATALOG_DUPLICATE_CURRICULUM_LINE', {
            details: [
              { field: 'disciplineId', reason: 'UNIQUE' },
              { field: 'sortOrder', reason: 'UNIQUE' },
            ],
          }),
        );
      }
      throw e;
    }
  }

  async patchCurriculumSort(
    gradeId: string,
    curriculumId: string,
    dto: PatchCurriculumSortDto,
  ) {
    await this.getById(gradeId);

    const line = await this.prisma.gradeCurriculum.findFirst({
      where: { id: curriculumId, gradeId },
    });
    if (!line) {
      throw new NotFoundException(
        businessError('GRADE_CURRICULUM_LINE_NOT_FOUND'),
      );
    }

    try {
      return await this.prisma.gradeCurriculum.update({
        where: { id: curriculumId },
        data: { sortOrder: dto.sortOrder },
        include: { discipline: true },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          businessError('CATALOG_DUPLICATE_CURRICULUM_SORT', {
            details: [{ field: 'sortOrder', reason: 'UNIQUE' }],
          }),
        );
      }
      throw e;
    }
  }

  async removeCurriculumLine(gradeId: string, curriculumId: string) {
    await this.getById(gradeId);

    const activeEnrollments = await this.prisma.enrollment.count({
      where: {
        gradeId,
        status: EnrollmentStatus.ACTIVE,
      },
    });
    if (activeEnrollments > 0) {
      throw new ConflictException(
        businessError('CATALOG_DEPENDENCY_CURRICULUM_REMOVE', {
          details: [{ field: 'enrollment', reason: 'ACTIVE_EXISTS' }],
        }),
      );
    }

    const result = await this.prisma.gradeCurriculum.deleteMany({
      where: { id: curriculumId, gradeId },
    });
    if (result.count === 0) {
      throw new NotFoundException(
        businessError('GRADE_CURRICULUM_LINE_NOT_FOUND'),
      );
    }
    return { deleted: true, id: curriculumId };
  }

  async listSchoolClasses(gradeId: string, query: PaginationQueryDto) {
    await this.getById(gradeId);
    const { limit, offset } = resolvePagination(query.limit, query.offset);
    const where = { gradeId };
    const [total, data] = await Promise.all([
      this.prisma.schoolClass.count({ where }),
      this.prisma.schoolClass.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: offset,
        take: limit,
      }),
    ]);
    return { data, meta: { total, limit, offset } };
  }

  async createSchoolClass(gradeId: string, dto: CreateSchoolClassDto) {
    await this.getById(gradeId);
    const name = normalizeCatalogLabel(dto.name);

    try {
      return await this.prisma.schoolClass.create({
        data: { gradeId, name },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          businessError('CATALOG_DUPLICATE_SCHOOL_CLASS', {
            details: [{ field: 'name', reason: 'UNIQUE' }],
          }),
        );
      }
      throw e;
    }
  }

  async getSchoolClassById(gradeId: string, classId: string) {
    await this.getById(gradeId);
    const schoolClass = await this.prisma.schoolClass.findFirst({
      where: { id: classId, gradeId },
    });
    if (!schoolClass) {
      throw new NotFoundException(businessError('SCHOOL_CLASS_NOT_FOUND'));
    }
    return schoolClass;
  }

  async patchSchoolClass(
    gradeId: string,
    classId: string,
    dto: UpdateSchoolClassDto,
  ) {
    await this.getById(gradeId);
    const schoolClass = await this.prisma.schoolClass.findFirst({
      where: { id: classId, gradeId },
    });
    if (!schoolClass) {
      throw new NotFoundException(businessError('SCHOOL_CLASS_NOT_FOUND'));
    }

    const name = normalizeCatalogLabel(dto.name);
    if (name === schoolClass.name) {
      return schoolClass;
    }

    try {
      return await this.prisma.schoolClass.update({
        where: { id: classId },
        data: { name },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          businessError('CATALOG_DUPLICATE_SCHOOL_CLASS', {
            details: [{ field: 'name', reason: 'UNIQUE' }],
          }),
        );
      }
      throw e;
    }
  }

  async deleteSchoolClass(gradeId: string, classId: string) {
    await this.getById(gradeId);

    const schoolClass = await this.prisma.schoolClass.findFirst({
      where: { id: classId, gradeId },
    });
    if (!schoolClass) {
      throw new NotFoundException(businessError('SCHOOL_CLASS_NOT_FOUND'));
    }

    /** `catalog.spec.md` §6.3 — MVP: bloquear se existir qualquer matrícula (incl. cancelada). */
    const byStatus = await this.prisma.enrollment.groupBy({
      by: ['status'],
      where: { schoolClassId: classId },
      _count: { _all: true },
    });
    const total = byStatus.reduce((s, g) => s + g._count._all, 0);
    if (total > 0) {
      const details = byStatus.map((g) => ({
        field: `enrollment.${g.status}`,
        reason: String(g._count._all),
      }));
      throw new ConflictException(
        businessError('CATALOG_DEPENDENCY_SCHOOL_CLASS_DELETE', {
          details,
        }),
      );
    }

    await this.prisma.schoolClass.delete({ where: { id: classId } });
    return { deleted: true, id: classId };
  }

  /**
   * Para cada nível `FIXED_SERIES` (filtrado ou todos), cria `Grade` faltantes
   * no ano letivo conforme `fixedSeriesTemplate`.
   */
  async materializeFromTemplate(dto: MaterializeFromTemplateDto) {
    const year = await this.prisma.academicYear.findUnique({
      where: { id: dto.academicYearId },
    });
    if (!year) {
      throw new NotFoundException(businessError('ACADEMIC_YEAR_NOT_FOUND'));
    }

    const ids = dto.educationLevelIds?.filter(Boolean);
    const where = {
      gradeCreationMode: GradeCreationMode.FIXED_SERIES,
      ...(ids?.length ? { id: { in: ids } } : {}),
    };

    const levels = await this.prisma.educationLevel.findMany({ where });
    if (ids?.length && levels.length !== ids.length) {
      throw new BadRequestException(
        businessError('VALIDATION_MATERIALIZE_EDUCATION_LEVEL_IDS', {
          details: [{ field: 'educationLevelIds', reason: 'INVALID' }],
        }),
      );
    }

    const results: {
      educationLevelId: string;
      code: string;
      created: number;
      skipped: number;
    }[] = [];

    for (const level of levels) {
      const rows = parseFixedSeriesTemplate(level.fixedSeriesTemplate);
      if (!rows?.length) {
        results.push({
          educationLevelId: level.id,
          code: level.code,
          created: 0,
          skipped: 0,
        });
        continue;
      }

      let created = 0;
      let skipped = 0;
      for (const row of rows) {
        const label = normalizeCatalogLabel(row.label);
        const exists = await this.prisma.grade.findFirst({
          where: {
            academicYearId: dto.academicYearId,
            educationLevelId: level.id,
            label,
          },
        });
        if (exists) {
          skipped += 1;
          continue;
        }
        await this.prisma.grade.create({
          data: {
            academicYearId: dto.academicYearId,
            educationLevelId: level.id,
            label,
            sortOrder: row.sortOrder,
          },
        });
        created += 1;
      }
      results.push({
        educationLevelId: level.id,
        code: level.code,
        created,
        skipped,
      });
    }

    return { academicYearId: dto.academicYearId, results };
  }

  private assertFixedSeriesGradeAllowed(
    level: {
      gradeCreationMode: GradeCreationMode;
      fixedSeriesTemplate: Prisma.JsonValue | null;
    },
    normalizedLabel: string,
    sortOrder: number,
    options: {
      requireSortFromClientIfFixed: boolean;
      clientSortOrder?: number | null;
    },
  ): void {
    if (level.gradeCreationMode !== GradeCreationMode.FIXED_SERIES) {
      return;
    }
    const rows = parseFixedSeriesTemplate(level.fixedSeriesTemplate);
    if (!rows?.length) {
      throw new BadRequestException(
        businessError('CATALOG_MISCONFIGURED_LEVEL', {
          details: [{ field: 'educationLevelId', reason: 'MISSING_TEMPLATE' }],
        }),
      );
    }
    if (
      options.requireSortFromClientIfFixed &&
      (options.clientSortOrder === undefined ||
        options.clientSortOrder === null)
    ) {
      throw new BadRequestException(
        businessError('VALIDATION_GRADE_SORT_REQUIRED_FIXED', {
          details: [{ field: 'sortOrder', reason: 'REQUIRED_FOR_FIXED' }],
        }),
      );
    }
    const allowed = rows.some(
      (r) =>
        normalizeCatalogLabel(r.label) === normalizedLabel &&
        Number(r.sortOrder) === sortOrder,
    );
    if (!allowed) {
      throw new BadRequestException(
        businessError('CATALOG_FIXED_SERIES', {
          details: [
            { field: 'label', reason: 'NOT_IN_TEMPLATE' },
            { field: 'sortOrder', reason: 'NOT_IN_TEMPLATE' },
          ],
        }),
      );
    }
  }
}

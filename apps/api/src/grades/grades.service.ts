import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus, GradeCreationMode, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddCurriculumLineDto } from './dto/add-curriculum-line.dto';
import { CreateGradeDto } from './dto/create-grade.dto';
import { CreateSchoolClassDto } from './dto/create-school-class.dto';
import { ListGradesQueryDto } from './dto/list-grades-query.dto';
import { MaterializeFromTemplateDto } from './dto/materialize-from-template.dto';
import { PatchCurriculumSortDto } from './dto/patch-curriculum-sort.dto';
import { parseFixedSeriesTemplate } from './fixed-series-template';
import { normalizeCatalogLabel } from './normalize-catalog-label';

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListGradesQueryDto) {
    return this.prisma.grade.findMany({
      where: {
        ...(query.academicYearId
          ? { academicYearId: query.academicYearId }
          : {}),
        ...(query.educationLevelId
          ? { educationLevelId: query.educationLevelId }
          : {}),
      },
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
    });
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
      throw new NotFoundException('Série não encontrada.');
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
      throw new NotFoundException('Ano letivo não encontrado.');
    }
    if (!level) {
      throw new NotFoundException('Nível de ensino não encontrado.');
    }

    if (level.gradeCreationMode === GradeCreationMode.FIXED_SERIES) {
      const rows = parseFixedSeriesTemplate(level.fixedSeriesTemplate);
      if (!rows?.length) {
        throw new BadRequestException({
          error: {
            code: 'CATALOG_MISCONFIGURED_LEVEL',
            message:
              'Nível com séries fixas sem roteiro (`fixedSeriesTemplate`). Corrija o cadastro do nível.',
            details: [
              { field: 'educationLevelId', reason: 'MISSING_TEMPLATE' },
            ],
          },
        });
      }

      if (dto.sortOrder === undefined || dto.sortOrder === null) {
        throw new BadRequestException({
          error: {
            code: 'VALIDATION_ERROR',
            message:
              'Para níveis com séries fixas, envie `sortOrder` igual ao definido no roteiro do nível.',
            details: [{ field: 'sortOrder', reason: 'REQUIRED_FOR_FIXED' }],
          },
        });
      }

      const norm = normalizeCatalogLabel(dto.label);
      const allowed = rows.some(
        (r) =>
          normalizeCatalogLabel(r.label) === norm &&
          Number(r.sortOrder) === dto.sortOrder,
      );
      if (!allowed) {
        throw new BadRequestException({
          error: {
            code: 'CATALOG_FIXED_SERIES',
            message:
              'Combinação de rótulo e ordem não faz parte do roteiro fixo deste nível (ex.: matriz SEE principal).',
            details: [
              { field: 'label', reason: 'NOT_IN_TEMPLATE' },
              { field: 'sortOrder', reason: 'NOT_IN_TEMPLATE' },
            ],
          },
        });
      }
    }

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
        throw new ConflictException({
          error: {
            code: 'CATALOG_DUPLICATE',
            message:
              'Já existe uma série com este ano letivo, nível e rótulo (após normalização).',
            details: [
              { field: 'label', reason: 'UNIQUE' },
              { field: 'academicYearId', reason: 'UNIQUE' },
              { field: 'educationLevelId', reason: 'UNIQUE' },
            ],
          },
        });
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
      throw new ConflictException({
        error: {
          code: 'CATALOG_DEPENDENCY',
          message:
            'Não é possível excluir a série: existem matrículas, turmas ou linhas de currículo vinculadas.',
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
        },
      });
    }

    await this.prisma.grade.delete({ where: { id } });
    return { deleted: true, id };
  }

  async listCurriculum(gradeId: string) {
    await this.getById(gradeId);
    return this.prisma.gradeCurriculum.findMany({
      where: { gradeId },
      orderBy: { sortOrder: 'asc' },
      include: { discipline: true },
    });
  }

  async addCurriculumLine(gradeId: string, dto: AddCurriculumLineDto) {
    await this.getById(gradeId);

    const discipline = await this.prisma.discipline.findUnique({
      where: { id: dto.disciplineId },
    });
    if (!discipline) {
      throw new NotFoundException('Disciplina não encontrada.');
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
        throw new ConflictException({
          error: {
            code: 'CATALOG_DUPLICATE',
            message:
              'Disciplina já está no currículo desta série ou a ordem já está em uso.',
            details: [
              { field: 'disciplineId', reason: 'UNIQUE' },
              { field: 'sortOrder', reason: 'UNIQUE' },
            ],
          },
        });
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
      throw new NotFoundException('Linha de currículo não encontrada nesta série.');
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
        throw new ConflictException({
          error: {
            code: 'CATALOG_DUPLICATE',
            message: 'Esta ordem já está em uso no currículo da série.',
            details: [{ field: 'sortOrder', reason: 'UNIQUE' }],
          },
        });
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
      throw new ConflictException({
        error: {
          code: 'CATALOG_DEPENDENCY',
          message:
            'Não é possível remover: existe matrícula ativa nesta série (currículo materializado).',
          details: [{ field: 'enrollment', reason: 'ACTIVE_EXISTS' }],
        },
      });
    }

    const result = await this.prisma.gradeCurriculum.deleteMany({
      where: { id: curriculumId, gradeId },
    });
    if (result.count === 0) {
      throw new NotFoundException('Linha de currículo não encontrada nesta série.');
    }
    return { deleted: true, id: curriculumId };
  }

  async listSchoolClasses(gradeId: string) {
    await this.getById(gradeId);
    return this.prisma.schoolClass.findMany({
      where: { gradeId },
      orderBy: { name: 'asc' },
    });
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
        throw new ConflictException({
          error: {
            code: 'CATALOG_DUPLICATE',
            message: 'Já existe uma turma com este nome nesta série.',
            details: [{ field: 'name', reason: 'UNIQUE' }],
          },
        });
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
      throw new NotFoundException('Turma não encontrada nesta série.');
    }

    const enrollments = await this.prisma.enrollment.count({
      where: { schoolClassId: classId },
    });
    if (enrollments > 0) {
      throw new ConflictException({
        error: {
          code: 'CATALOG_DEPENDENCY',
          message:
            'Não é possível excluir a turma: existe matrícula vinculada (inclui canceladas — política MVP).',
          details: [{ field: 'enrollment', reason: 'EXISTS' }],
        },
      });
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
      throw new NotFoundException('Ano letivo não encontrado.');
    }

    const ids = dto.educationLevelIds?.filter(Boolean);
    const where = {
      gradeCreationMode: GradeCreationMode.FIXED_SERIES,
      ...(ids?.length ? { id: { in: ids } } : {}),
    };

    const levels = await this.prisma.educationLevel.findMany({ where });
    if (ids?.length && levels.length !== ids.length) {
      throw new BadRequestException({
        error: {
          code: 'VALIDATION_ERROR',
          message:
            'Algum id em `educationLevelIds` não existe ou não está em `FIXED_SERIES`.',
          details: [{ field: 'educationLevelIds', reason: 'INVALID' }],
        },
      });
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
}

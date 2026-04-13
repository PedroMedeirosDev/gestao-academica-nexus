import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GradeCreationMode, Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { businessError } from '../common/errors/business-error';
import { resolvePagination } from '../common/pagination/resolve-pagination';
import {
  parseFixedSeriesTemplate,
  validateNoDuplicateLabelsAndOrders,
  type FixedSeriesRow,
} from '../grades/fixed-series-template';
import { normalizeCatalogLabel } from '../grades/normalize-catalog-label';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEducationLevelDto } from './dto/create-education-level.dto';
import { UpdateEducationLevelDto } from './dto/update-education-level.dto';

@Injectable()
export class EducationLevelsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationQueryDto) {
    const { limit, offset } = resolvePagination(query.limit, query.offset);
    const where = {};
    const [total, data] = await Promise.all([
      this.prisma.educationLevel.count({ where }),
      this.prisma.educationLevel.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip: offset,
        take: limit,
      }),
    ]);
    return { data, meta: { total, limit, offset } };
  }

  async getById(id: string) {
    const level = await this.prisma.educationLevel.findUnique({
      where: { id },
    });
    if (!level) {
      throw new NotFoundException(businessError('EDUCATION_LEVEL_NOT_FOUND'));
    }
    return level;
  }

  async create(dto: CreateEducationLevelDto) {
    const code = dto.code.trim().toUpperCase();
    const name = dto.name.trim();
    const sortOrder = dto.sortOrder ?? 0;
    const gradeCreationMode =
      dto.gradeCreationMode ?? GradeCreationMode.FREE;

    if (gradeCreationMode === GradeCreationMode.FIXED_SERIES) {
      if (!dto.fixedSeriesTemplate?.length) {
        throw new BadRequestException(
          businessError('VALIDATION_EDUCATION_LEVEL_FIXED_TEMPLATE_REQUIRED', {
            details: [{ field: 'fixedSeriesTemplate', reason: 'REQUIRED' }],
          }),
        );
      }
      const rows: FixedSeriesRow[] = dto.fixedSeriesTemplate.map((r) => ({
        label: r.label,
        sortOrder: r.sortOrder,
      }));
      validateNoDuplicateLabelsAndOrders(rows);
    }

    try {
      return await this.prisma.educationLevel.create({
        data: {
          code,
          name,
          sortOrder,
          gradeCreationMode,
          fixedSeriesTemplate:
            gradeCreationMode === GradeCreationMode.FIXED_SERIES
              ? (dto.fixedSeriesTemplate as unknown as Prisma.InputJsonValue)
              : Prisma.JsonNull,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          businessError('CATALOG_DUPLICATE_EDUCATION_LEVEL_CODE', {
            details: [{ field: 'code', reason: 'UNIQUE' }],
          }),
        );
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateEducationLevelDto) {
    const level = await this.getById(id);

    const templateChanged = dto.fixedSeriesTemplate !== undefined;
    const modeChanged = dto.gradeCreationMode !== undefined;
    const nextMode = dto.gradeCreationMode ?? level.gradeCreationMode;

    if (
      dto.fixedSeriesTemplate !== undefined &&
      nextMode === GradeCreationMode.FREE
    ) {
      throw new BadRequestException(
        businessError('VALIDATION_EDUCATION_LEVEL_TEMPLATE_INVALID_FOR_FREE', {
          details: [{ field: 'fixedSeriesTemplate', reason: 'INVALID_FOR_FREE' }],
        }),
      );
    }

    const mergedTemplateJson =
      dto.fixedSeriesTemplate !== undefined
        ? (dto.fixedSeriesTemplate as unknown as Prisma.JsonValue)
        : level.fixedSeriesTemplate;

    if (nextMode === GradeCreationMode.FIXED_SERIES) {
      const parsed = parseFixedSeriesTemplate(mergedTemplateJson ?? null);
      if (!parsed?.length) {
        throw new BadRequestException(
          businessError('VALIDATION_EDUCATION_LEVEL_FIXED_REQUIRES_TEMPLATE', {
            details: [{ field: 'fixedSeriesTemplate', reason: 'REQUIRED' }],
          }),
        );
      }
      validateNoDuplicateLabelsAndOrders(parsed);
      if (templateChanged || modeChanged) {
        await this.assertGradesCompatibleWithTemplate(level.id, parsed);
      }
    }

    const data: Prisma.EducationLevelUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }
    if (dto.sortOrder !== undefined) {
      data.sortOrder = dto.sortOrder;
    }
    if (dto.gradeCreationMode !== undefined) {
      data.gradeCreationMode = dto.gradeCreationMode;
      if (dto.gradeCreationMode === GradeCreationMode.FREE) {
        data.fixedSeriesTemplate = Prisma.JsonNull;
      }
    }
    if (
      dto.fixedSeriesTemplate !== undefined &&
      nextMode === GradeCreationMode.FIXED_SERIES
    ) {
      data.fixedSeriesTemplate =
        dto.fixedSeriesTemplate as unknown as Prisma.InputJsonValue;
    }

    return this.prisma.educationLevel.update({
      where: { id },
      data,
    });
  }

  async deleteLevel(id: string) {
    await this.getById(id);
    const gradeCount = await this.prisma.grade.count({
      where: { educationLevelId: id },
    });
    if (gradeCount > 0) {
      throw new ConflictException(
        businessError('EDUCATION_LEVEL_DELETE_HAS_GRADES', {
          details: [
            {
              field: 'grades',
              reason: 'EXISTS',
            },
          ],
        }),
      );
    }
    await this.prisma.educationLevel.delete({ where: { id } });
    return { deleted: true, id };
  }

  private async assertGradesCompatibleWithTemplate(
    educationLevelId: string,
    rows: FixedSeriesRow[],
  ) {
    const grades = await this.prisma.grade.findMany({
      where: { educationLevelId },
      select: { label: true, sortOrder: true },
    });
    for (const g of grades) {
      const ok = rows.some(
        (r) =>
          normalizeCatalogLabel(r.label) === normalizeCatalogLabel(g.label) &&
          r.sortOrder === g.sortOrder,
      );
      if (!ok) {
        throw new ConflictException(
          businessError('CATALOG_DEPENDENCY_EDUCATION_LEVEL_TEMPLATE', {
            details: [
              {
                field: 'fixedSeriesTemplate',
                reason: 'CONFLICTS_WITH_GRADES',
              },
            ],
          }),
        );
      }
    }
  }
}

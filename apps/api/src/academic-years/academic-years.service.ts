import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { businessError } from '../common/errors/business-error';
import { resolvePagination } from '../common/pagination/resolve-pagination';
import type { ApiErrorDetail } from '../common/types/api-error.types';
import { IdempotencyScope } from '../idempotency/idempotency-scopes';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';

export type CreateAcademicYearContext = {
  userId: string;
  idempotencyKey?: string | undefined;
};

@Injectable()
export class AcademicYearsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotency: IdempotencyService,
  ) {}

  async list(query: PaginationQueryDto) {
    const { limit, offset } = resolvePagination(query.limit, query.offset);
    const where = {};
    const [total, data] = await Promise.all([
      this.prisma.academicYear.count({ where }),
      this.prisma.academicYear.findMany({
        where,
        orderBy: { year: 'desc' },
        skip: offset,
        take: limit,
      }),
    ]);
    return { data, meta: { total, limit, offset } };
  }

  create(dto: CreateAcademicYearDto, context: CreateAcademicYearContext) {
    return this.idempotency.executeOrReplay({
      scope: IdempotencyScope.ACADEMIC_YEAR_CREATE,
      userId: context.userId,
      idempotencyKey: context.idempotencyKey,
      requestBody: dto,
      successStatusCode: 201,
      execute: async () => {
        try {
          return await this.prisma.academicYear.create({
            data: { year: dto.year },
          });
        } catch (e) {
          if (
            e instanceof Prisma.PrismaClientKnownRequestError &&
            e.code === 'P2002'
          ) {
            throw new ConflictException(
              businessError('CATALOG_DUPLICATE_ACADEMIC_YEAR', {
                details: [{ field: 'year', reason: 'UNIQUE' }],
              }),
            );
          }
          throw e;
        }
      },
    });
  }

  async getById(id: string) {
    const year = await this.prisma.academicYear.findUnique({ where: { id } });
    if (!year) {
      throw new NotFoundException(businessError('ACADEMIC_YEAR_NOT_FOUND'));
    }
    return year;
  }

  async updateYear(id: string, dto: UpdateAcademicYearDto) {
    if (dto.year === undefined) {
      throw new BadRequestException(
        businessError('VALIDATION_PATCH_EMPTY', {
          details: [{ field: 'year', reason: 'REQUIRED' }],
        }),
      );
    }
    const current = await this.getById(id);
    if (dto.year === current.year) {
      return current;
    }

    const [grades, enrollments, plans] = await Promise.all([
      this.prisma.grade.count({ where: { academicYearId: id } }),
      this.prisma.enrollment.count({
        where: { grade: { academicYearId: id } },
      }),
      this.prisma.paymentPlan.count({ where: { academicYearId: id } }),
    ]);

    if (grades + enrollments + plans > 0) {
      const details: ApiErrorDetail[] = [];
      if (grades > 0) {
        details.push({ field: 'grades', reason: 'EXISTS' });
      }
      if (enrollments > 0) {
        details.push({ field: 'enrollments', reason: 'EXISTS' });
      }
      if (plans > 0) {
        details.push({ field: 'paymentPlans', reason: 'EXISTS' });
      }
      throw new ConflictException(
        businessError('CATALOG_DEPENDENCY_ACADEMIC_YEAR_EDIT', { details }),
      );
    }

    try {
      return await this.prisma.academicYear.update({
        where: { id },
        data: { year: dto.year },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          businessError('CATALOG_DUPLICATE_ACADEMIC_YEAR', {
            details: [{ field: 'year', reason: 'UNIQUE' }],
          }),
        );
      }
      throw e;
    }
  }

  async deleteYear(id: string) {
    await this.getById(id);

    const [grades, enrollments, plans] = await Promise.all([
      this.prisma.grade.count({ where: { academicYearId: id } }),
      this.prisma.enrollment.count({
        where: { grade: { academicYearId: id } },
      }),
      this.prisma.paymentPlan.count({ where: { academicYearId: id } }),
    ]);

    if (grades + enrollments + plans > 0) {
      const details: ApiErrorDetail[] = [];
      if (grades > 0) {
        details.push({ field: 'grades', reason: 'EXISTS' });
      }
      if (enrollments > 0) {
        details.push({ field: 'enrollments', reason: 'EXISTS' });
      }
      if (plans > 0) {
        details.push({ field: 'paymentPlans', reason: 'EXISTS' });
      }
      throw new ConflictException(
        businessError('CATALOG_DEPENDENCY_ACADEMIC_YEAR_DELETE', { details }),
      );
    }

    await this.prisma.academicYear.delete({ where: { id } });
    return { deleted: true, id };
  }
}

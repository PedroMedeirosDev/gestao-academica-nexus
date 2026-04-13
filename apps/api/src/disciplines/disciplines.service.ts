import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { businessError } from '../common/errors/business-error';
import { resolvePagination } from '../common/pagination/resolve-pagination';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDisciplineDto } from './dto/create-discipline.dto';

@Injectable()
export class DisciplinesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationQueryDto) {
    const { limit, offset } = resolvePagination(query.limit, query.offset);
    const where = {};
    const [total, data] = await Promise.all([
      this.prisma.discipline.count({ where }),
      this.prisma.discipline.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: offset,
        take: limit,
      }),
    ]);
    return { data, meta: { total, limit, offset } };
  }

  async create(dto: CreateDisciplineDto) {
    const name = dto.name.trim();
    const code = dto.code?.trim() || null;
    return this.prisma.discipline.create({
      data: { name, code },
    });
  }

  async getById(id: string) {
    const d = await this.prisma.discipline.findUnique({ where: { id } });
    if (!d) {
      throw new NotFoundException(businessError('DISCIPLINE_NOT_FOUND'));
    }
    return d;
  }

  async deleteDiscipline(id: string) {
    await this.getById(id);
    const [inCurriculum, inEnrollment] = await Promise.all([
      this.prisma.gradeCurriculum.count({ where: { disciplineId: id } }),
      this.prisma.enrollmentSubject.count({ where: { disciplineId: id } }),
    ]);
    if (inCurriculum + inEnrollment > 0) {
      throw new ConflictException(
        businessError('DISCIPLINE_DELETE_IN_USE', {
          details: [
            ...(inCurriculum > 0
              ? [{ field: 'gradeCurriculum', reason: 'EXISTS' as const }]
              : []),
            ...(inEnrollment > 0
              ? [{ field: 'enrollmentSubjects', reason: 'EXISTS' as const }]
              : []),
          ],
        }),
      );
    }
    await this.prisma.discipline.delete({ where: { id } });
    return { deleted: true, id };
  }
}

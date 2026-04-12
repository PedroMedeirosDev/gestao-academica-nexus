import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';

@Injectable()
export class AcademicYearsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.academicYear.findMany({
      orderBy: { year: 'desc' },
    });
  }

  async create(dto: CreateAcademicYearDto) {
    try {
      return await this.prisma.academicYear.create({
        data: { year: dto.year },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException({
          error: {
            code: 'CATALOG_DUPLICATE',
            message: 'Já existe um ano letivo com este valor.',
            details: [{ field: 'year', reason: 'UNIQUE' }],
          },
        });
      }
      throw e;
    }
  }
}

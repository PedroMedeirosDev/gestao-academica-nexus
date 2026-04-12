import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDisciplineDto } from './dto/create-discipline.dto';

@Injectable()
export class DisciplinesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.discipline.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateDisciplineDto) {
    const name = dto.name.trim();
    const code = dto.code?.trim() || null;
    return this.prisma.discipline.create({
      data: { name, code },
    });
  }
}

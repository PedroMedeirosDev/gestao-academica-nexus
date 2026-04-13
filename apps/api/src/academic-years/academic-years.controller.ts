import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AcademicYearsService } from './academic-years.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto';

type AuthedRequest = Request & {
  user: { userId: string; email: string; role: UserRole };
};

@ApiTags('Academic years')
@ApiBearerAuth('JWT-auth')
@Controller('academic-years')
export class AcademicYearsController {
  constructor(private readonly academicYears: AcademicYearsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar anos letivos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  list(@Query() query: PaginationQueryDto) {
    return this.academicYears.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter ano letivo por id' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicYears.getById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description:
      'Opcional. Mesma chave e mesmo corpo (até 24 h) devolve a mesma resposta sem criar outro registro (`api.spec.md` §6).',
  })
  @ApiOperation({ summary: 'Criar ano letivo' })
  @ApiResponse({ status: 201, description: 'Criado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({
    status: 409,
    description:
      'Ano duplicado (`CATALOG_DUPLICATE_ACADEMIC_YEAR`) ou chave de idempotência com corpo diferente (`IDEMPOTENCY_KEY_CONFLICT`)',
  })
  create(@Body() dto: CreateAcademicYearDto, @Req() req: AuthedRequest) {
    const raw = req.headers['idempotency-key'];
    const idempotencyKey = typeof raw === 'string' ? raw.trim() : undefined;
    return this.academicYears.create(dto, {
      userId: req.user.userId,
      idempotencyKey:
        idempotencyKey && idempotencyKey.length > 0
          ? idempotencyKey
          : undefined,
    });
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar valor do ano',
    description:
      'Só permitido se não houver séries, matrículas nem planos de pagamento vinculados (`catalog.spec.md` §1).',
  })
  @ApiResponse({ status: 200, description: 'Atualizado' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  @ApiResponse({ status: 409, description: 'Dependências ou ano duplicado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAcademicYearDto,
  ) {
    return this.academicYears.updateYear(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Excluir ano letivo',
    description:
      'Só permitido sem séries, matrículas nem planos de pagamento (`catalog.spec.md` §1).',
  })
  @ApiResponse({ status: 200, description: 'Removido' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  @ApiResponse({ status: 409, description: 'Dependências' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicYears.deleteYear(id);
  }
}

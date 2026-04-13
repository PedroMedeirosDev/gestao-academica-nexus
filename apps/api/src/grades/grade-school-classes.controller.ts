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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateSchoolClassDto } from './dto/create-school-class.dto';
import { UpdateSchoolClassDto } from './dto/update-school-class.dto';
import { GradesService } from './grades.service';

@ApiTags('Catálogo — turmas')
@ApiBearerAuth('JWT-auth')
@Controller('grades/:gradeId/classes')
export class GradeSchoolClassesController {
  constructor(private readonly grades: GradesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar turmas da série' })
  list(
    @Param('gradeId', ParseUUIDPipe) gradeId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.grades.listSchoolClasses(gradeId, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar turma na série' })
  @ApiResponse({ status: 409, description: 'Nome duplicado na série' })
  create(
    @Param('gradeId', ParseUUIDPipe) gradeId: string,
    @Body() dto: CreateSchoolClassDto,
  ) {
    return this.grades.createSchoolClass(gradeId, dto);
  }

  @Get(':classId')
  @ApiOperation({ summary: 'Obter turma por id (dentro da série)' })
  @ApiResponse({ status: 404, description: 'Turma ou série não encontrada' })
  getById(
    @Param('gradeId', ParseUUIDPipe) gradeId: string,
    @Param('classId', ParseUUIDPipe) classId: string,
  ) {
    return this.grades.getSchoolClassById(gradeId, classId);
  }

  @Patch(':classId')
  @ApiOperation({
    summary: 'Renomear turma',
    description:
      'Nome normalizado como na criação; único dentro da série (`catalog.spec.md` §6.1–6.2).',
  })
  @ApiResponse({ status: 200, description: 'Atualizada' })
  @ApiResponse({ status: 404, description: 'Não encontrada' })
  @ApiResponse({ status: 409, description: 'Nome duplicado na série' })
  patch(
    @Param('gradeId', ParseUUIDPipe) gradeId: string,
    @Param('classId', ParseUUIDPipe) classId: string,
    @Body() dto: UpdateSchoolClassDto,
  ) {
    return this.grades.patchSchoolClass(gradeId, classId, dto);
  }

  @Delete(':classId')
  @ApiOperation({
    summary: 'Excluir turma',
    description:
      'Bloqueado se existir **qualquer** matrícula nesta turma, em qualquer status, incl. cancelada (`catalog.spec.md` §6.3). Em 409, `details` traz contagem por status.',
  })
  @ApiResponse({ status: 409, description: 'Matrículas vinculadas (detalhe por status)' })
  remove(
    @Param('gradeId', ParseUUIDPipe) gradeId: string,
    @Param('classId', ParseUUIDPipe) classId: string,
  ) {
    return this.grades.deleteSchoolClass(gradeId, classId);
  }
}

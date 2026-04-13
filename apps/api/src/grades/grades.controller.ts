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
import { CreateGradeDto } from './dto/create-grade.dto';
import { ListGradesQueryDto } from './dto/list-grades-query.dto';
import { MaterializeFromTemplateDto } from './dto/materialize-from-template.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { GradesService } from './grades.service';

@ApiTags('Catálogo — séries')
@ApiBearerAuth('JWT-auth')
@Controller('grades')
export class GradesController {
  constructor(private readonly grades: GradesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar séries',
    description:
      'Filtros opcionais: `academicYearId`, `educationLevelId`. Resposta paginada: `data` + `meta` (`limit` padrão 20, máx. 50; `offset`).',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  list(@Query() query: ListGradesQueryDto) {
    return this.grades.list(query);
  }

  @Post('materialize-from-template')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Materializar séries a partir do roteiro fixo',
    description:
      'Para o ano letivo informado, cria `Grade` faltantes conforme `fixedSeriesTemplate` de cada nível em `FIXED_SERIES` (todos ou os ids informados).',
  })
  @ApiResponse({ status: 200, description: 'Resumo por nível' })
  @ApiResponse({ status: 400, description: 'Validação' })
  @ApiResponse({ status: 404, description: 'Ano letivo não encontrado' })
  materializeFromTemplate(@Body() dto: MaterializeFromTemplateDto) {
    return this.grades.materializeFromTemplate(dto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar série (ano + nível + rótulo)',
    description:
      'Se o nível estiver em `FIXED_SERIES`, só aceita combinações do `fixedSeriesTemplate` daquele nível; caso contrário (`FREE`), rótulo livre.',
  })
  @ApiResponse({ status: 201, description: 'Criada' })
  @ApiResponse({ status: 409, description: 'Duplicidade ou dependência' })
  create(@Body() dto: CreateGradeDto) {
    return this.grades.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter série por id' })
  @ApiResponse({ status: 404, description: 'Não encontrada' })
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.grades.getById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar série',
    description:
      'PATCH parcial: `label`, `sortOrder`, `academicYearId`, `educationLevelId`. Mudar ano ou nível bloqueado com matrícula Reserva/Ativa (`catalog.spec.md` §3).',
  })
  @ApiResponse({ status: 200, description: 'Atualizada' })
  @ApiResponse({ status: 400, description: 'Validação' })
  @ApiResponse({ status: 404, description: 'Não encontrada' })
  @ApiResponse({ status: 409, description: 'Duplicidade ou bloqueio por matrícula' })
  patch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGradeDto,
  ) {
    return this.grades.patchGrade(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir série',
    description:
      'Bloqueado se houver matrícula, turma ou currículo (`catalog.spec.md` §3).',
  })
  @ApiResponse({ status: 409, description: 'Dependências' })
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.grades.deleteGrade(id);
  }
}

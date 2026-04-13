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
import { CreateEducationLevelDto } from './dto/create-education-level.dto';
import { UpdateEducationLevelDto } from './dto/update-education-level.dto';
import { EducationLevelsService } from './education-levels.service';

@ApiTags('Catálogo — níveis de ensino')
@ApiBearerAuth('JWT-auth')
@Controller('education-levels')
export class EducationLevelsController {
  constructor(private readonly educationLevels: EducationLevelsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar níveis de ensino' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  list(@Query() query: PaginationQueryDto) {
    return this.educationLevels.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter nível de ensino por id' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.educationLevels.getById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar nível de ensino' })
  @ApiResponse({ status: 201, description: 'Criado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 409, description: 'Código duplicado' })
  create(@Body() dto: CreateEducationLevelDto) {
    return this.educationLevels.create(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar nível de ensino',
    description:
      'PATCH parcial: nome, ordem, `gradeCreationMode`, `fixedSeriesTemplate`. Mudanças de roteiro em `FIXED_SERIES` exigem compatibilidade com séries já existentes.',
  })
  @ApiResponse({ status: 200, description: 'Atualizado' })
  @ApiResponse({ status: 400, description: 'Validação' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  @ApiResponse({ status: 409, description: 'Conflito com séries existentes' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEducationLevelDto,
  ) {
    return this.educationLevels.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Excluir nível de ensino',
    description:
      'Bloqueado se existir série em qualquer ano usando este nível (`catalog.spec.md` §2).',
  })
  @ApiResponse({ status: 200, description: 'Removido' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  @ApiResponse({ status: 409, description: 'Existem séries vinculadas' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.educationLevels.deleteLevel(id);
  }
}

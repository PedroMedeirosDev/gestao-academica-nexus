import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import { CreateDisciplineDto } from './dto/create-discipline.dto';
import { DisciplinesService } from './disciplines.service';

@ApiTags('Catálogo — disciplinas')
@ApiBearerAuth('JWT-auth')
@Controller('disciplines')
export class DisciplinesController {
  constructor(private readonly disciplines: DisciplinesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar disciplinas (catálogo mestre)' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  list(@Query() query: PaginationQueryDto) {
    return this.disciplines.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter disciplina por id' })
  @ApiResponse({ status: 404, description: 'Não encontrada' })
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.disciplines.getById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar disciplina' })
  @ApiResponse({ status: 201, description: 'Criado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  create(@Body() dto: CreateDisciplineDto) {
    return this.disciplines.create(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Excluir disciplina',
    description:
      'Bloqueada se constar de currículo de série ou de disciplina de matrícula (`catalog.spec.md` §4).',
  })
  @ApiResponse({ status: 200, description: 'Removida' })
  @ApiResponse({ status: 404, description: 'Não encontrada' })
  @ApiResponse({ status: 409, description: 'Em uso' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.disciplines.deleteDiscipline(id);
  }
}

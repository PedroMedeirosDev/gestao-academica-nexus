import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
  list() {
    return this.disciplines.list();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar disciplina' })
  @ApiResponse({ status: 201, description: 'Criado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  create(@Body() dto: CreateDisciplineDto) {
    return this.disciplines.create(dto);
  }
}

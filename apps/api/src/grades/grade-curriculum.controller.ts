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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AddCurriculumLineDto } from './dto/add-curriculum-line.dto';
import { PatchCurriculumSortDto } from './dto/patch-curriculum-sort.dto';
import { GradesService } from './grades.service';

@ApiTags('Catálogo — currículo da série')
@ApiBearerAuth('JWT-auth')
@Controller('grades/:gradeId/curriculum')
export class GradeCurriculumController {
  constructor(private readonly grades: GradesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar disciplinas do currículo da série' })
  list(@Param('gradeId', ParseUUIDPipe) gradeId: string) {
    return this.grades.listCurriculum(gradeId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Incluir disciplina no currículo' })
  @ApiResponse({ status: 409, description: 'Duplicidade de disciplina ou ordem' })
  add(
    @Param('gradeId', ParseUUIDPipe) gradeId: string,
    @Body() dto: AddCurriculumLineDto,
  ) {
    return this.grades.addCurriculumLine(gradeId, dto);
  }

  @Patch(':curriculumId')
  @ApiOperation({ summary: 'Alterar ordem de uma linha do currículo' })
  @ApiResponse({ status: 409, description: 'Ordem duplicada' })
  patchSort(
    @Param('gradeId', ParseUUIDPipe) gradeId: string,
    @Param('curriculumId', ParseUUIDPipe) curriculumId: string,
    @Body() dto: PatchCurriculumSortDto,
  ) {
    return this.grades.patchCurriculumSort(gradeId, curriculumId, dto);
  }

  @Delete(':curriculumId')
  @ApiOperation({
    summary: 'Remover disciplina do currículo',
    description: 'Bloqueado se existir matrícula ativa na série (`catalog.spec.md` §5).',
  })
  @ApiResponse({ status: 409, description: 'Matrícula ativa na série' })
  remove(
    @Param('gradeId', ParseUUIDPipe) gradeId: string,
    @Param('curriculumId', ParseUUIDPipe) curriculumId: string,
  ) {
    return this.grades.removeCurriculumLine(gradeId, curriculumId);
  }
}

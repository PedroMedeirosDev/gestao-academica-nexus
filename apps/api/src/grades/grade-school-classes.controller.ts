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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateSchoolClassDto } from './dto/create-school-class.dto';
import { GradesService } from './grades.service';

@ApiTags('Catálogo — turmas')
@ApiBearerAuth('JWT-auth')
@Controller('grades/:gradeId/classes')
export class GradeSchoolClassesController {
  constructor(private readonly grades: GradesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar turmas da série' })
  list(@Param('gradeId', ParseUUIDPipe) gradeId: string) {
    return this.grades.listSchoolClasses(gradeId);
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

  @Delete(':classId')
  @ApiOperation({
    summary: 'Excluir turma',
    description:
      'Bloqueado se existir qualquer matrícula com esta turma (`catalog.spec.md` §6).',
  })
  @ApiResponse({ status: 409, description: 'Matrículas vinculadas' })
  remove(
    @Param('gradeId', ParseUUIDPipe) gradeId: string,
    @Param('classId', ParseUUIDPipe) classId: string,
  ) {
    return this.grades.deleteSchoolClass(gradeId, classId);
  }
}

import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AcademicYearsService } from './academic-years.service';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';

@ApiTags('Academic years')
@ApiBearerAuth('JWT-auth')
@Controller('academic-years')
export class AcademicYearsController {
  constructor(private readonly academicYears: AcademicYearsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar anos letivos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  list() {
    return this.academicYears.list();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar ano letivo' })
  @ApiResponse({ status: 201, description: 'Criado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 409, description: 'Ano duplicado (CATALOG_DUPLICATE)' })
  create(@Body() dto: CreateAcademicYearDto) {
    return this.academicYears.create(dto);
  }
}

import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ParseCuidPipe } from '../common/pipes/parse-cuid.pipe';
import { AddGuardianLinkDto } from './dto/add-guardian-link.dto';
import { PatchGuardianLinkDto } from './dto/patch-guardian-link.dto';
import { StudentsService } from './students.service';

@ApiTags('Secretaria — alunos — responsáveis (vínculos)')
@ApiBearerAuth('JWT-auth')
@Controller('students/:studentId/guardians')
export class StudentGuardiansController {
  constructor(private readonly students: StudentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Vincular responsável existente ao aluno',
    description:
      'O responsável deve já existir (`POST /guardians`). `isAddressSource` exige endereço completo na pessoa.',
  })
  @ApiResponse({ status: 201, description: 'Vínculo criado' })
  @ApiResponse({ status: 404, description: 'Aluno ou responsável não encontrado' })
  @ApiResponse({ status: 409, description: 'Vínculo duplicado' })
  add(
    @Param('studentId', ParseCuidPipe) studentId: string,
    @Body() dto: AddGuardianLinkDto,
  ) {
    return this.students.addGuardianLink(studentId, dto);
  }

  @Patch(':linkId')
  @ApiOperation({ summary: 'Atualizar vínculo (parentesco, financeiro, morada, ordem)' })
  @ApiResponse({ status: 404, description: 'Vínculo não encontrado' })
  patch(
    @Param('studentId', ParseCuidPipe) studentId: string,
    @Param('linkId', ParseCuidPipe) linkId: string,
    @Body() dto: PatchGuardianLinkDto,
  ) {
    return this.students.patchGuardianLink(studentId, linkId, dto);
  }

  @Delete(':linkId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover vínculo aluno–responsável' })
  @ApiResponse({ status: 404, description: 'Vínculo não encontrado' })
  async remove(
    @Param('studentId', ParseCuidPipe) studentId: string,
    @Param('linkId', ParseCuidPipe) linkId: string,
  ) {
    await this.students.removeGuardianLink(studentId, linkId);
  }
}

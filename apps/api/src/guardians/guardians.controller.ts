import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { ParseCuidPipe } from '../common/pipes/parse-cuid.pipe';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { ListGuardiansQueryDto } from './dto/list-guardians-query.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';
import { GuardiansService } from './guardians.service';

@ApiTags('Secretaria — responsáveis')
@ApiBearerAuth('JWT-auth')
@Controller('guardians')
export class GuardiansController {
  constructor(private readonly guardians: GuardiansService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar responsável (pessoa)',
    description:
      'Chave legal única por tabela. Duplicidade de CPF/documento → erro; use pesquisa e vínculo em `students/:id/guardians`.',
  })
  @ApiResponse({ status: 201, description: 'Criado' })
  @ApiResponse({ status: 409, description: 'Identidade duplicada' })
  create(@Body() dto: CreateGuardianDto) {
    return this.guardians.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar responsáveis', description: 'Paginação + `q` opcional.' })
  list(@Query() query: ListGuardiansQueryDto) {
    return this.guardians.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter responsável por id' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  getById(@Param('id', ParseCuidPipe) id: string) {
    return this.guardians.getById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar responsável',
    description: 'PATCH parcial. Identidade legal não pode ser alterada.',
  })
  @ApiResponse({ status: 400, description: 'Validação' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  update(@Param('id', ParseCuidPipe) id: string, @Body() dto: UpdateGuardianDto) {
    return this.guardians.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Excluir responsável',
    description: 'Bloqueado se ainda houver vínculo com algum aluno.',
  })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  @ApiResponse({ status: 409, description: 'Ainda vinculado a aluno(s)' })
  async remove(@Param('id', ParseCuidPipe) id: string) {
    await this.guardians.remove(id);
  }
}

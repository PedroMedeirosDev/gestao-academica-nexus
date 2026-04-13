import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { businessError } from '../common/errors/business-error';
import { ParseCuidPipe } from '../common/pipes/parse-cuid.pipe';
import { CreateStudentDto } from './dto/create-student.dto';
import { DeleteStudentQueryDto } from './dto/delete-student-query.dto';
import { ListStudentsQueryDto } from './dto/list-students-query.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { STUDENT_PORTRAIT_MAX_BYTES } from './student-portrait.constants';
import { StudentPortraitService } from './student-portrait.service';
import { StudentsService } from './students.service';

@ApiTags('Secretaria — alunos')
@ApiBearerAuth('JWT-auth')
@Controller('students')
export class StudentsController {
  constructor(
    private readonly students: StudentsService,
    private readonly portraits: StudentPortraitService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar aluno (rascunho)',
    description:
      'Cria registo em `DRAFT`. Identidade legal é imutável após a criação. Duplicidade: bloqueio se já existir completo; conflito se existir rascunho com a mesma chave.',
  })
  @ApiResponse({ status: 201, description: 'Criado' })
  @ApiResponse({ status: 409, description: 'Duplicidade / rascunho existente' })
  create(@Body() dto: CreateStudentDto) {
    return this.students.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar alunos',
    description:
      'Paginação `limit`/`offset`. Filtro `q`: nome, CPF, documento, RG ou nome de responsável vinculado.',
  })
  list(@Query() query: ListStudentsQueryDto) {
    return this.students.list(query);
  }

  @Get(':id/portrait/signed-url')
  @ApiOperation({
    summary: 'URL assinada para visualizar o retrato',
    description:
      'Gera URL temporária (Supabase) sem expor o browser diretamente ao storage. TTL configurável por `PORTRAIT_SIGNED_URL_TTL_SECONDS` (60–86400; padrão 3600).',
  })
  @ApiResponse({ status: 400, description: 'Aluno sem retrato' })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  @ApiResponse({ status: 503, description: 'Storage não configurado' })
  portraitSignedUrl(@Param('id', ParseCuidPipe) id: string) {
    return this.portraits.getSignedReadUrl(id);
  }

  @Post(':id/portrait')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: STUDENT_PORTRAIT_MAX_BYTES },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({
    summary: 'Enviar ou substituir retrato do aluno',
    description:
      'Grava no bucket Supabase (`student-portraits` por omissão) e persiste só `portraitPhotoObjectKey`. JPEG, PNG ou WebP; máximo 5 MB.',
  })
  @ApiResponse({ status: 200, description: 'Chave atualizada' })
  @ApiResponse({ status: 400, description: 'Arquivo inválido ou falha no storage' })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  @ApiResponse({ status: 503, description: 'Storage não configurado' })
  async uploadPortrait(
    @Param('id', ParseCuidPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException(
        businessError('STUDENT_PORTRAIT_FILE_REQUIRED'),
      );
    }
    return this.portraits.upload(id, file);
  }

  @Delete(':id/portrait')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover retrato do aluno',
    description: 'Apaga o objeto no storage (se existir) e limpa `portraitPhotoObjectKey`.',
  })
  @ApiResponse({ status: 204, description: 'Retrato removido' })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado' })
  @ApiResponse({ status: 503, description: 'Storage não configurado' })
  async clearPortrait(@Param('id', ParseCuidPipe) id: string) {
    await this.portraits.clear(id);
  }

  @Post(':id/complete')
  @ApiOperation({
    summary: 'Marcar cadastro como completo',
    description:
      'Valida campos obrigatórios (spec alunos), morada ou “mora com”, e regras de menor + responsável financeiro.',
  })
  @ApiResponse({ status: 400, description: 'Cadastro incompleto' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  complete(@Param('id', ParseCuidPipe) id: string) {
    return this.students.complete(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter aluno por id (com vínculos e fonte de morada)' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  getById(@Param('id', ParseCuidPipe) id: string) {
    return this.students.getById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar aluno',
    description:
      'PATCH parcial. Identidade legal não pode ser alterada. `addressSourceLinkId` sincroniza flags “mora com”.',
  })
  @ApiResponse({ status: 400, description: 'Validação' })
  @ApiResponse({ status: 404, description: 'Não encontrado' })
  update(@Param('id', ParseCuidPipe) id: string, @Body() dto: UpdateStudentDto) {
    return this.students.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiHeader({
    name: 'X-Deletion-Confirm',
    required: true,
    description: 'Envie `1` para confirmar a exclusão.',
  })
  @ApiOperation({
    summary: 'Excluir aluno',
    description:
      'Bloqueado se existir matrícula. Opcional: `deleteOrphanGuardians=true` remove responsáveis sem outros vínculos.',
  })
  @ApiResponse({ status: 204, description: 'Excluído' })
  @ApiResponse({ status: 400, description: 'Confirmação ausente' })
  @ApiResponse({ status: 409, description: 'Matrículas vinculadas' })
  async remove(
    @Param('id', ParseCuidPipe) id: string,
    @Query() query: DeleteStudentQueryDto,
    @Headers('x-deletion-confirm') confirmHeader?: string,
  ) {
    await this.students.delete(id, {
      confirmHeader,
      deleteOrphanGuardians: query.deleteOrphanGuardians === true,
    });
  }
}

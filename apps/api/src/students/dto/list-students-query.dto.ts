import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListStudentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Pesquisa por nome do aluno, CPF (só dígitos), chave legal ou nome de responsável vinculado.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}

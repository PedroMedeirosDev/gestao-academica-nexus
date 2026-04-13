import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListGuardiansQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Pesquisa por nome, CPF (dígitos), chave legal ou número de documento.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}

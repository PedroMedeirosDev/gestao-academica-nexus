import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** `catalog.spec.md` §1 — alterar o valor do ano só quando permitido (sem dependentes). */
export class UpdateAcademicYearDto {
  @ApiPropertyOptional({ example: 2028, minimum: 1990, maximum: 2100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1990)
  @Max(2100)
  year?: number;
}

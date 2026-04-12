import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

/** Alinhado a `docs/specs/catalogo/catalog.spec.md` — ano entre 1990 e 2100. */
export class CreateAcademicYearDto {
  @ApiProperty({ example: 2027, minimum: 1990, maximum: 2100 })
  @Type(() => Number)
  @IsInt()
  @Min(1990)
  @Max(2100)
  year: number;
}

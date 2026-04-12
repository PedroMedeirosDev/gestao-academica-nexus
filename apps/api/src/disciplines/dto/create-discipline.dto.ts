import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Alinhado a `docs/specs/catalogo/catalog.spec.md` §4. */
export class CreateDisciplineDto {
  @ApiProperty({ example: 'Língua Portuguesa' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ required: false, example: 'LP', description: 'Sigla ou código opcional' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  code?: string;
}

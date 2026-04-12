import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GradeCreationMode } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { FixedSeriesTemplateItemDto } from './fixed-series-template-item.dto';

/** Alinhado a `docs/specs/catalogo/catalog.spec.md` §2 + política de séries (`docs/decisions.md`). */
export class CreateEducationLevelDto {
  @ApiProperty({ example: 'EFAF_EFTI_2026', description: 'Código estável (único).' })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @Matches(/^[A-Za-z0-9_]+$/, {
    message: 'code deve conter apenas letras, números e underscore',
  })
  code!: string;

  @ApiProperty({ example: 'Ensino Fundamental — Anos finais (integral SEE/MG 2026)' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ required: false, default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  sortOrder?: number;

  @ApiPropertyOptional({
    enum: GradeCreationMode,
    default: GradeCreationMode.FREE,
    description:
      '`FIXED_SERIES` = só séries do roteiro (ex. SEE principal); `FREE` = criação livre (ex. esportes).',
  })
  @IsOptional()
  @IsEnum(GradeCreationMode)
  gradeCreationMode?: GradeCreationMode;

  @ApiPropertyOptional({
    type: [FixedSeriesTemplateItemDto],
    description: 'Obrigatório quando `gradeCreationMode` = `FIXED_SERIES`.',
  })
  @ValidateIf(
    (o: CreateEducationLevelDto) =>
      o.gradeCreationMode === GradeCreationMode.FIXED_SERIES,
  )
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FixedSeriesTemplateItemDto)
  fixedSeriesTemplate?: FixedSeriesTemplateItemDto[];
}

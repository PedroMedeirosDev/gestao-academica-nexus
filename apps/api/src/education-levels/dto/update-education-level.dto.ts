import { ApiPropertyOptional } from '@nestjs/swagger';
import { GradeCreationMode } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { FixedSeriesTemplateItemDto } from './fixed-series-template-item.dto';

export class UpdateEducationLevelDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  sortOrder?: number;

  @ApiPropertyOptional({ enum: GradeCreationMode })
  @IsOptional()
  @IsEnum(GradeCreationMode)
  gradeCreationMode?: GradeCreationMode;

  @ApiPropertyOptional({ type: [FixedSeriesTemplateItemDto] })
  @ValidateIf((o: UpdateEducationLevelDto) => o.fixedSeriesTemplate !== undefined)
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FixedSeriesTemplateItemDto)
  fixedSeriesTemplate?: FixedSeriesTemplateItemDto[];
}

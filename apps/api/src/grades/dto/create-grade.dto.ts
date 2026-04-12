import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateGradeDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  academicYearId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  educationLevelId!: string;

  @ApiProperty({ example: '7º ano' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  label!: string;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  sortOrder?: number;
}

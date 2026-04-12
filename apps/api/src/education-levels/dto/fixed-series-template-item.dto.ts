import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class FixedSeriesTemplateItemDto {
  @ApiProperty({ example: '7º ano' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  label!: string;

  @ApiProperty({ example: 7, description: 'Ordem de exibição / identificação na série' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  sortOrder!: number;
}

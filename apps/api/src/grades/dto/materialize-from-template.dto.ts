import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID } from 'class-validator';

/** Cria, para um ano letivo, todas as séries do roteiro de cada nível `FIXED_SERIES`. */
export class MaterializeFromTemplateDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  academicYearId!: string;

  @ApiPropertyOptional({
    description:
      'IDs de níveis em `FIXED_SERIES`. Se omitido ou `[]`, processa todos os níveis fixos.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  educationLevelIds?: string[];
}

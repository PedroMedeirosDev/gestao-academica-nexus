import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RelationshipType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { CUID_REGEX } from '../../common/validation/cuid';

export class AddGuardianLinkDto {
  @ApiProperty()
  @Matches(CUID_REGEX)
  guardianId!: string;

  @ApiProperty({ enum: RelationshipType })
  @IsEnum(RelationshipType)
  relationshipType!: RelationshipType;

  @ApiProperty({ default: false })
  @Type(() => Boolean)
  @IsBoolean()
  isFinancialResponsible!: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999)
  displayOrder?: number;

  @ApiPropertyOptional({
    description: 'Se true, morada do aluno segue este responsável (endereço completo obrigatório na pessoa).',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isAddressSource?: boolean;
}

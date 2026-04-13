import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IdentityTrack, Sex } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ enum: IdentityTrack })
  @IsEnum(IdentityTrack)
  identityTrack!: IdentityTrack;

  @ApiPropertyOptional({ description: 'Obrigatório se `identityTrack` = CPF' })
  @ValidateIf((o: CreateStudentDto) => o.identityTrack === IdentityTrack.CPF)
  @IsString()
  @MinLength(11)
  @MaxLength(14)
  cpf?: string;

  @ApiPropertyOptional({ description: 'Obrigatório se `identityTrack` = FOREIGN_DOCUMENT' })
  @ValidateIf((o: CreateStudentDto) => o.identityTrack === IdentityTrack.FOREIGN_DOCUMENT)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  identityDocumentType?: string;

  @ValidateIf((o: CreateStudentDto) => o.identityTrack === IdentityTrack.FOREIGN_DOCUMENT)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  identityDocumentNumber?: string;

  @ApiPropertyOptional()
  @ValidateIf((o: CreateStudentDto) => o.identityTrack === IdentityTrack.FOREIGN_DOCUMENT)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  identityIssuingCountry?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: '2012-05-20' })
  @IsDateString()
  birthDate!: string;

  @ApiPropertyOptional({ enum: Sex })
  @IsOptional()
  @IsEnum(Sex)
  sex?: Sex;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nationality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  rg?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  naturalCity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8)
  naturalState?: string;

  @ApiProperty({ default: false })
  @Type(() => Boolean)
  @IsBoolean()
  imageUsageAuthorized!: boolean;
}

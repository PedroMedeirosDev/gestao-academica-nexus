import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IdentityTrack } from '@prisma/client';
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

export class CreateGuardianDto {
  @ApiProperty({ enum: IdentityTrack })
  @IsEnum(IdentityTrack)
  identityTrack!: IdentityTrack;

  @ApiPropertyOptional()
  @ValidateIf((o: CreateGuardianDto) => o.identityTrack === IdentityTrack.CPF)
  @IsString()
  @MinLength(11)
  @MaxLength(14)
  cpf?: string;

  @ValidateIf((o: CreateGuardianDto) => o.identityTrack === IdentityTrack.FOREIGN_DOCUMENT)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  identityDocumentType?: string;

  @ValidateIf((o: CreateGuardianDto) => o.identityTrack === IdentityTrack.FOREIGN_DOCUMENT)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  identityDocumentNumber?: string;

  @ApiPropertyOptional()
  @ValidateIf((o: CreateGuardianDto) => o.identityTrack === IdentityTrack.FOREIGN_DOCUMENT)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  identityIssuingCountry?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ example: '1980-03-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiProperty({ default: false })
  @Type(() => Boolean)
  @IsBoolean()
  deceased!: boolean;

  @ApiProperty()
  @IsEmail()
  @MaxLength(200)
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  phone!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  profession?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  maritalStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  educationLevelNote?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  street!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  number!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  complement?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  neighborhood!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  city!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(8)
  state!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(16)
  zipCode!: string;
}

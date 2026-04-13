import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/** `catalog.spec.md` §6.2 — renomear turma respeitando unicidade na série. */
export class UpdateSchoolClassDto {
  @ApiProperty({ example: '7º B' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;
}

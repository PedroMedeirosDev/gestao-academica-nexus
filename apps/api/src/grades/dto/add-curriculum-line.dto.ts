import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class AddCurriculumLineDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  disciplineId!: string;

  @ApiProperty({ example: 1, minimum: 1, description: 'Ordem única dentro da série' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  sortOrder!: number;
}

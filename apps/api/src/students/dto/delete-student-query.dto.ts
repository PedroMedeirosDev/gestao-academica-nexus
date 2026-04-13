import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class DeleteStudentQueryDto {
  @ApiPropertyOptional({
    description:
      'Se `true`, apaga responsáveis que ficarem sem vínculo após excluir o aluno.',
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  deleteOrphanGuardians?: boolean;
}

import { Module } from '@nestjs/common';
import { EducationLevelsController } from './education-levels.controller';
import { EducationLevelsService } from './education-levels.service';

@Module({
  controllers: [EducationLevelsController],
  providers: [EducationLevelsService],
})
export class EducationLevelsModule {}

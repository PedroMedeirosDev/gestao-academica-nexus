import { Module } from '@nestjs/common';
import { GradeCurriculumController } from './grade-curriculum.controller';
import { GradeSchoolClassesController } from './grade-school-classes.controller';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';

@Module({
  controllers: [
    GradesController,
    GradeCurriculumController,
    GradeSchoolClassesController,
  ],
  providers: [GradesService],
})
export class GradesModule {}

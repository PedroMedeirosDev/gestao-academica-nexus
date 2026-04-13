import { Module } from '@nestjs/common';
import { GuardiansModule } from '../guardians/guardians.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StudentGuardiansController } from './student-guardians.controller';
import { StudentPortraitStorageService } from './student-portrait-storage.service';
import { StudentPortraitService } from './student-portrait.service';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  imports: [PrismaModule, GuardiansModule],
  controllers: [StudentsController, StudentGuardiansController],
  providers: [
    StudentsService,
    StudentPortraitStorageService,
    StudentPortraitService,
  ],
  exports: [StudentsService],
})
export class StudentsModule {}

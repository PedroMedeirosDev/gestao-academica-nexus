import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AcademicYearsModule } from './academic-years/academic-years.module';
import { AuthModule } from './auth/auth.module';
import { DisciplinesModule } from './disciplines/disciplines.module';
import { EducationLevelsModule } from './education-levels/education-levels.module';
import { GradesModule } from './grades/grades.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
    AcademicYearsModule,
    EducationLevelsModule,
    DisciplinesModule,
    GradesModule,
  ],
})
export class AppModule {}

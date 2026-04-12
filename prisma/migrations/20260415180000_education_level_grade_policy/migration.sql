-- Política de séries por nível: trilha principal (séries fixas) vs trilha livre (ex.: esportes).

CREATE TYPE "GradeCreationMode" AS ENUM ('FREE', 'FIXED_SERIES');

ALTER TABLE "EducationLevel"
ADD COLUMN "gradeCreationMode" "GradeCreationMode" NOT NULL DEFAULT 'FREE',
ADD COLUMN "fixedSeriesTemplate" JSONB;

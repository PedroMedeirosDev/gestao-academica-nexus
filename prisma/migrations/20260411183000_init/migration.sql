-- CreateEnum
CREATE TYPE "IdentityTrack" AS ENUM ('CPF', 'FOREIGN_DOCUMENT');

-- CreateEnum
CREATE TYPE "StudentLifecycleStatus" AS ENUM ('DRAFT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('FEMALE', 'MALE', 'OTHER', 'PREFER_NOT_SAY');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('FATHER', 'MOTHER', 'STEPFATHER', 'STEPMOTHER', 'GUARDIAN', 'OTHER');

-- CreateEnum
CREATE TYPE "EnrollmentType" AS ENUM ('REGULAR');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('RESERVATION', 'ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AcademicResult" AS ENUM ('IN_PROGRESS');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED_BRL');

-- CreateEnum
CREATE TYPE "DueDateStrategy" AS ENUM ('SINGLE_DATE', 'FIXED_DAY_OF_MONTH', 'MANUAL');

-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('OPEN', 'CANCELLED');

-- CreateTable
CREATE TABLE "InstitutionSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "majorityAge" INTEGER NOT NULL DEFAULT 18,
    "minAgeStudentMaritalStatus" INTEGER NOT NULL DEFAULT 18,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationLevel" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "educationLevelId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discipline" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discipline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeCurriculum" (
    "id" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "disciplineId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "GradeCurriculum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolClass" (
    "id" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "lifecycleStatus" "StudentLifecycleStatus" NOT NULL DEFAULT 'DRAFT',
    "legalIdentityKey" TEXT NOT NULL,
    "identityTrack" "IdentityTrack" NOT NULL,
    "cpf" TEXT,
    "identityDocumentType" TEXT,
    "identityDocumentNumber" TEXT,
    "identityIssuingCountry" TEXT,
    "name" TEXT NOT NULL,
    "birthDate" DATE NOT NULL,
    "sex" "Sex",
    "nationality" TEXT,
    "rg" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "naturalCity" TEXT,
    "naturalState" TEXT,
    "imageUsageAuthorized" BOOLEAN NOT NULL DEFAULT false,
    "maritalStatus" TEXT,
    "observations" TEXT,
    "addressSourceLinkId" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "healthNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guardian" (
    "id" TEXT NOT NULL,
    "legalIdentityKey" TEXT NOT NULL,
    "identityTrack" "IdentityTrack" NOT NULL,
    "cpf" TEXT,
    "identityDocumentType" TEXT,
    "identityDocumentNumber" TEXT,
    "identityIssuingCountry" TEXT,
    "name" TEXT NOT NULL,
    "birthDate" DATE,
    "deceased" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "profession" TEXT,
    "maritalStatus" TEXT,
    "educationLevelNote" TEXT,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentGuardianLink" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "relationshipType" "RelationshipType" NOT NULL,
    "isFinancialResponsible" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isAddressSource" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StudentGuardianLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentDocument" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "academicYearId" TEXT,
    "gradeId" TEXT,
    "baseAmount" DECIMAL(12,2) NOT NULL,
    "discountType" "DiscountType",
    "discountValue" DECIMAL(12,4),
    "installmentCount" INTEGER NOT NULL,
    "dueDateStrategy" "DueDateStrategy" NOT NULL,
    "firstDueDate" DATE,
    "fixedDayOfMonth" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "publicCode" TEXT,
    "studentId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "schoolClassId" TEXT,
    "enrollmentType" "EnrollmentType" NOT NULL DEFAULT 'REGULAR',
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'RESERVATION',
    "academicResult" "AcademicResult" NOT NULL DEFAULT 'IN_PROGRESS',
    "selectedPaymentPlanId" TEXT,
    "activatedAt" TIMESTAMP(3),
    "planSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentSubject" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "disciplineId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "EnrollmentSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Installment" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "dueDate" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "InstallmentStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Installment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Occurrence" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "disciplineId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Occurrence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_year_key" ON "AcademicYear"("year");

-- CreateIndex
CREATE UNIQUE INDEX "EducationLevel_code_key" ON "EducationLevel"("code");

-- CreateIndex
CREATE INDEX "Grade_academicYearId_idx" ON "Grade"("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_academicYearId_educationLevelId_label_key" ON "Grade"("academicYearId", "educationLevelId", "label");

-- CreateIndex
CREATE INDEX "Discipline_name_idx" ON "Discipline"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GradeCurriculum_gradeId_disciplineId_key" ON "GradeCurriculum"("gradeId", "disciplineId");

-- CreateIndex
CREATE UNIQUE INDEX "GradeCurriculum_gradeId_sortOrder_key" ON "GradeCurriculum"("gradeId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolClass_gradeId_name_key" ON "SchoolClass"("gradeId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Student_legalIdentityKey_key" ON "Student"("legalIdentityKey");

-- CreateIndex
CREATE UNIQUE INDEX "Student_cpf_key" ON "Student"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Student_addressSourceLinkId_key" ON "Student"("addressSourceLinkId");

-- CreateIndex
CREATE INDEX "Student_name_idx" ON "Student"("name");

-- CreateIndex
CREATE INDEX "Student_lifecycleStatus_idx" ON "Student"("lifecycleStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_legalIdentityKey_key" ON "Guardian"("legalIdentityKey");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_cpf_key" ON "Guardian"("cpf");

-- CreateIndex
CREATE INDEX "Guardian_name_idx" ON "Guardian"("name");

-- CreateIndex
CREATE INDEX "StudentGuardianLink_studentId_idx" ON "StudentGuardianLink"("studentId");

-- CreateIndex
CREATE INDEX "StudentGuardianLink_guardianId_idx" ON "StudentGuardianLink"("guardianId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentGuardianLink_studentId_guardianId_key" ON "StudentGuardianLink"("studentId", "guardianId");

-- CreateIndex
CREATE INDEX "StudentDocument_studentId_idx" ON "StudentDocument"("studentId");

-- CreateIndex
CREATE INDEX "PaymentPlan_academicYearId_idx" ON "PaymentPlan"("academicYearId");

-- CreateIndex
CREATE INDEX "PaymentPlan_gradeId_idx" ON "PaymentPlan"("gradeId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_publicCode_key" ON "Enrollment"("publicCode");

-- CreateIndex
CREATE INDEX "Enrollment_studentId_idx" ON "Enrollment"("studentId");

-- CreateIndex
CREATE INDEX "Enrollment_gradeId_idx" ON "Enrollment"("gradeId");

-- CreateIndex
CREATE INDEX "Enrollment_status_idx" ON "Enrollment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EnrollmentSubject_enrollmentId_disciplineId_key" ON "EnrollmentSubject"("enrollmentId", "disciplineId");

-- CreateIndex
CREATE UNIQUE INDEX "EnrollmentSubject_enrollmentId_sortOrder_key" ON "EnrollmentSubject"("enrollmentId", "sortOrder");

-- CreateIndex
CREATE INDEX "Installment_enrollmentId_idx" ON "Installment"("enrollmentId");

-- CreateIndex
CREATE INDEX "Installment_status_idx" ON "Installment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Installment_enrollmentId_sequenceNumber_key" ON "Installment"("enrollmentId", "sequenceNumber");

-- CreateIndex
CREATE INDEX "Occurrence_studentId_idx" ON "Occurrence"("studentId");

-- CreateIndex
CREATE INDEX "Occurrence_enrollmentId_idx" ON "Occurrence"("enrollmentId");

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_educationLevelId_fkey" FOREIGN KEY ("educationLevelId") REFERENCES "EducationLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeCurriculum" ADD CONSTRAINT "GradeCurriculum_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeCurriculum" ADD CONSTRAINT "GradeCurriculum_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolClass" ADD CONSTRAINT "SchoolClass_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_addressSourceLinkId_fkey" FOREIGN KEY ("addressSourceLinkId") REFERENCES "StudentGuardianLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGuardianLink" ADD CONSTRAINT "StudentGuardianLink_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGuardianLink" ADD CONSTRAINT "StudentGuardianLink_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDocument" ADD CONSTRAINT "StudentDocument_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentPlan" ADD CONSTRAINT "PaymentPlan_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentPlan" ADD CONSTRAINT "PaymentPlan_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_schoolClassId_fkey" FOREIGN KEY ("schoolClassId") REFERENCES "SchoolClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_selectedPaymentPlanId_fkey" FOREIGN KEY ("selectedPaymentPlanId") REFERENCES "PaymentPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentSubject" ADD CONSTRAINT "EnrollmentSubject_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentSubject" ADD CONSTRAINT "EnrollmentSubject_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Nexus: regras do spec (student-flow §10) — não expressáveis só com @@unique do Prisma
-- No máximo uma matrícula Reserva ou Ativa por (aluno, série, tipo); várias Canceladas permitidas.
CREATE UNIQUE INDEX "Enrollment_student_grade_type_open_key"
ON "Enrollment" ("studentId", "gradeId", "enrollmentType")
WHERE "status" IN ('RESERVATION', 'ACTIVE');

-- matricula-campos §4 — no máximo um vínculo como fonte de endereço "mora com" por aluno
CREATE UNIQUE INDEX "StudentGuardianLink_one_address_source_per_student"
ON "StudentGuardianLink" ("studentId")
WHERE "isAddressSource" = true;

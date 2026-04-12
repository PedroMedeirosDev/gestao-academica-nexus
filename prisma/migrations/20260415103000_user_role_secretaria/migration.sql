-- Alinha o valor do enum ao vocabulário PT-BR do domínio (secretaria).

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

ALTER TYPE "UserRole" RENAME VALUE 'SECRETARIAT' TO 'SECRETARIA';

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'SECRETARIA'::"UserRole";

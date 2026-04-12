-- Tabela única de usuários da plataforma; `role` discrimina o perfil (MVP: só SECRETARIAT).

CREATE TYPE "UserRole" AS ENUM ('SECRETARIAT');

ALTER TABLE "SecretariatUser" RENAME TO "User";

ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'SECRETARIAT';

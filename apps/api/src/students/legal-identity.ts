import { IdentityTrack } from '@prisma/client';

/** Chave única institucional alinhada a `student-flow.spec.md` §5 e comentário em `schema.prisma`. */
export function buildStudentLegalIdentityKey(
  track: IdentityTrack,
  cpf: string | null | undefined,
  docType: string | null | undefined,
  docNumber: string | null | undefined,
): string {
  if (track === IdentityTrack.CPF) {
    const d = normalizeCpfDigits(cpf);
    return `CPF:${d}`;
  }
  const t = normalizeDocType(docType);
  const n = normalizeDocNumber(docNumber);
  return `DOC:${t}:${n}`;
}

export function buildGuardianLegalIdentityKey(
  track: IdentityTrack,
  cpf: string | null | undefined,
  docType: string | null | undefined,
  docNumber: string | null | undefined,
): string {
  return buildStudentLegalIdentityKey(track, cpf, docType, docNumber);
}

export function normalizeCpfDigits(raw: string | null | undefined): string {
  if (!raw) {
    return '';
  }
  return raw.replace(/\D/g, '');
}

function normalizeDocType(raw: string | null | undefined): string {
  if (!raw) {
    return '';
  }
  return raw.trim().toUpperCase().replace(/\s+/g, '_');
}

function normalizeDocNumber(raw: string | null | undefined): string {
  if (!raw) {
    return '';
  }
  return raw.trim().replace(/\s+/g, ' ').toUpperCase();
}

/** Validação de dígitos verificadores (CPF brasileiro). */
export function isValidCpfDigits(digits: string): boolean {
  if (!/^\d{11}$/.test(digits)) {
    return false;
  }
  if (/^(\d)\1{10}$/.test(digits)) {
    return false;
  }
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i], 10) * (10 - i);
  }
  let mod = (sum * 10) % 11;
  if (mod === 10 || mod === 11) {
    mod = 0;
  }
  if (mod !== parseInt(digits[9], 10)) {
    return false;
  }
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i], 10) * (11 - i);
  }
  mod = (sum * 10) % 11;
  if (mod === 10 || mod === 11) {
    mod = 0;
  }
  return mod === parseInt(digits[10], 10);
}

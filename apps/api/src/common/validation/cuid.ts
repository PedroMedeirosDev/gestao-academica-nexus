/** Prisma `@default(cuid())` — formato estável suficiente para validação de rota/DTO. */
export const CUID_REGEX = /^c[a-z0-9]{24}$/i;

export function isCuid(value: string | undefined | null): boolean {
  return typeof value === 'string' && CUID_REGEX.test(value);
}

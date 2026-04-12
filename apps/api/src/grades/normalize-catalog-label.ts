/** Alinha rótulos ao spec: trim + espaços internos colapsados (`catalog.spec.md` §3). */
export function normalizeCatalogLabel(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

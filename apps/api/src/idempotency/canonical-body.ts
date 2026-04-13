import { createHash } from 'crypto';

/** JSON canônico (chaves ordenadas) para hash estável do corpo. */
export function canonicalJsonStringify(input: unknown): string {
  return JSON.stringify(canonicalize(input));
}

export function bodySha256(input: unknown): string {
  return createHash('sha256').update(canonicalJsonStringify(input)).digest('hex');
}

function canonicalize(input: unknown): unknown {
  if (input === null || typeof input !== 'object') {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map(canonicalize);
  }
  const obj = input as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    out[k] = canonicalize(obj[k]);
  }
  return out;
}

import { BadRequestException } from '@nestjs/common';
import { businessError } from '../common/errors/business-error';
import { normalizeCatalogLabel } from './normalize-catalog-label';

export type FixedSeriesRow = { label: string; sortOrder: number };

/** Interpreta `fixedSeriesTemplate` vindo do Prisma (JSON). */
export function parseFixedSeriesTemplate(raw: unknown): FixedSeriesRow[] | null {
  if (raw === null || raw === undefined) return null;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const rows: FixedSeriesRow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null;
    const o = item as Record<string, unknown>;
    if (typeof o.label !== 'string' || typeof o.sortOrder !== 'number') {
      return null;
    }
    rows.push({ label: o.label, sortOrder: o.sortOrder });
  }
  return rows;
}

/** Garante rótulos normalizados únicos e `sortOrder` único no roteiro. */
export function validateNoDuplicateLabelsAndOrders(rows: FixedSeriesRow[]): void {
  const seenLabels = new Set<string>();
  const seenOrders = new Set<number>();
  for (const row of rows) {
    const nl = normalizeCatalogLabel(row.label);
    if (seenLabels.has(nl)) {
      throw new BadRequestException(
        businessError('VALIDATION_FIXED_SERIES_DUPLICATE_LABEL', {
          details: [{ field: 'fixedSeriesTemplate', reason: 'DUPLICATE_LABEL' }],
        }),
      );
    }
    seenLabels.add(nl);
    if (seenOrders.has(row.sortOrder)) {
      throw new BadRequestException(
        businessError('VALIDATION_FIXED_SERIES_DUPLICATE_ORDER', {
          details: [{ field: 'fixedSeriesTemplate', reason: 'DUPLICATE_ORDER' }],
        }),
      );
    }
    seenOrders.add(row.sortOrder);
  }
}

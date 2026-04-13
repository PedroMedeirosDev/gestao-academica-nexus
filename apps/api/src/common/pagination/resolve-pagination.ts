const DEFAULT_LIMIT = 20;

export type ListPaginationMeta = {
  total: number;
  limit: number;
  offset: number;
};

export type PaginatedPayload<T> = {
  data: T[];
  meta: ListPaginationMeta;
};

export function resolvePagination(
  limit?: number,
  offset?: number,
): { limit: number; offset: number } {
  return {
    limit: limit === undefined ? DEFAULT_LIMIT : limit,
    offset: offset === undefined ? 0 : offset,
  };
}

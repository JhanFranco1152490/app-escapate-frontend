'use client';

import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import { useCallback } from 'react';

import type { QuoteStatusFilter } from './api';

const STATUSES = [
  'draft',
  'sent',
  'expired',
  'accepted',
  'rejected',
] as const satisfies QuoteStatusFilter[];

const parsers = {
  q: parseAsString.withDefault(''),
  // Un estado desconocido en la URL se lee como "todas", en vez de que la API lo rechace.
  status: parseAsStringLiteral(STATUSES),
  page: parseAsInteger.withDefault(1),
};

// Búsqueda, estado y página en la URL. Cambiar un filtro vuelve a la primera página.
export function useQuoteFilters() {
  const [values, setValues] = useQueryStates(parsers, { history: 'replace' });

  const setSearch = useCallback(
    (q: string) => void setValues({ q: q || null, page: null }),
    [setValues],
  );
  const setStatus = useCallback(
    (status: QuoteStatusFilter | null) =>
      void setValues({ status, page: null }),
    [setValues],
  );
  const setPage = useCallback(
    (page: number) => void setValues({ page: page > 1 ? page : null }),
    [setValues],
  );
  const clearFilters = useCallback(
    () => void setValues({ q: null, status: null, page: null }),
    [setValues],
  );

  return {
    search: values.q,
    q: values.q.trim(),
    status: values.status,
    page: Math.max(values.page, 1),
    setSearch,
    setStatus,
    setPage,
    clearFilters,
  };
}

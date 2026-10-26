'use client';

import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import { useCallback } from 'react';

import type { ClientListFilters, ClientType } from './api';

const CLIENT_TYPES = ['person', 'company'] as const satisfies ClientType[];

const parsers = {
  q: parseAsString.withDefault(''),
  client_type: parseAsStringLiteral(CLIENT_TYPES),
  page: parseAsInteger.withDefault(1),
};

type FilterPatch = { q?: string; client_type?: ClientType | null };

// Filtros y página en la URL: un enlace copiado o una recarga muestran la misma lista.
// `replace` para que cada filtro no agregue una entrada al historial del navegador.
export function useClientFilters() {
  const [values, setValues] = useQueryStates(parsers, { history: 'replace' });

  // Cambiar un filtro siempre vuelve a la primera página: la página actual puede no existir
  // con el filtro nuevo. Un texto vacío sale de la URL.
  const setFilter = useCallback(
    (patch: FilterPatch) =>
      void setValues({
        ...patch,
        ...(patch.q !== undefined && { q: patch.q || null }),
        page: null,
      }),
    [setValues],
  );

  const setPage = useCallback(
    (page: number) => void setValues({ page: page > 1 ? page : null }),
    [setValues],
  );

  const clearFilters = useCallback(
    () => void setValues({ q: null, client_type: null, page: null }),
    [setValues],
  );

  const filters: ClientListFilters = {
    q: values.q.trim(),
    clientType: values.client_type,
    page: Math.max(values.page, 1),
  };
  const hasFilters = filters.q !== '' || filters.clientType !== null;

  return {
    search: values.q,
    filters,
    hasFilters,
    setFilter,
    setPage,
    clearFilters,
  };
}

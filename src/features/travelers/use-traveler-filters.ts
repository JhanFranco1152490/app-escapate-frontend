'use client';

import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { useCallback } from 'react';

import type { TravelerListFilters } from './api';

const parsers = {
  q: parseAsString.withDefault(''),
  client_id: parseAsInteger,
  page: parseAsInteger.withDefault(1),
};

type FilterPatch = { q?: string; client_id?: number | null };

// Filtros y página en la URL: la ficha del cliente enlaza a la lista con su `client_id`.
// `replace` para que cada filtro no agregue una entrada al historial del navegador.
export function useTravelerFilters() {
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
    () => void setValues({ q: null, client_id: null, page: null }),
    [setValues],
  );

  // Un id imposible (0, negativo o más grande de lo que JavaScript representa) la API lo
  // rechazaría con un 422 y la lista mostraría un error que "Reintentar" no arregla.
  const clientId =
    values.client_id !== null &&
    Number.isSafeInteger(values.client_id) &&
    values.client_id >= 1
      ? values.client_id
      : null;

  const filters: TravelerListFilters = {
    q: values.q.trim(),
    clientId,
    page: Math.max(values.page, 1),
  };
  const hasFilters = filters.q !== '' || filters.clientId !== null;

  return {
    search: values.q,
    filters,
    hasFilters,
    setFilter,
    setPage,
    clearFilters,
  };
}

'use client';

import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import { useCallback } from 'react';

import type { UserListFilters, UserStatusFilter } from './api';

const STATUSES = ['active', 'inactive'] as const satisfies UserStatusFilter[];

const parsers = {
  q: parseAsString.withDefault(''),
  status: parseAsStringLiteral(STATUSES),
  role_id: parseAsInteger,
  page: parseAsInteger.withDefault(1),
};

type FilterPatch = {
  q?: string;
  status?: UserStatusFilter | null;
  role_id?: number | null;
};

// Filtros y página en la URL: un enlace copiado o una recarga muestran la misma lista.
// `replace` para que cada filtro no agregue una entrada al historial del navegador.
export function useUserFilters() {
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
    () => void setValues({ q: null, status: null, role_id: null, page: null }),
    [setValues],
  );

  // Un id imposible (0, negativo o más grande de lo que JavaScript representa) la API lo
  // rechazaría con un 422 y la lista mostraría un error que "Reintentar" no arregla.
  const roleId =
    values.role_id !== null &&
    Number.isSafeInteger(values.role_id) &&
    values.role_id >= 1
      ? values.role_id
      : null;

  const filters: UserListFilters = {
    q: values.q.trim(),
    status: values.status,
    roleId,
    page: Math.max(values.page, 1),
  };
  const hasFilters =
    filters.q !== '' || filters.status !== null || filters.roleId !== null;

  return {
    search: values.q,
    filters,
    hasFilters,
    setFilter,
    setPage,
    clearFilters,
  };
}

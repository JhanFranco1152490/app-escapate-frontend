'use client';

import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import { useCallback } from 'react';

import { useCurrentUser } from '@/features/auth/components/session-guard';

import type { SummaryFilters, TravelRequestStatus } from './api';

const STATUSES = [
  'new',
  'quoting',
  'quoted',
  'closed',
] as const satisfies TravelRequestStatus[];

const parsers = {
  q: parseAsString.withDefault(''),
  // Un estado desconocido en la URL se lee como "todas", en vez de que la API lo rechace.
  status: parseAsStringLiteral(STATUSES),
  mine: parseAsBoolean.withDefault(false),
  client_id: parseAsInteger,
  page: parseAsInteger.withDefault(1),
};

type FilterPatch = {
  q?: string;
  status?: TravelRequestStatus | null;
  mine?: boolean;
  client_id?: number | null;
};

// Filtros y página en la URL, compartidos por la lista y "Por cotizar". "Mis solicitudes" va
// en la URL como `mine` y no con el id del asesor, para que el enlace sirva a cualquiera.
// `replace` para que cada filtro no agregue una entrada al historial del navegador.
export function useRequestFilters() {
  const user = useCurrentUser();
  const [values, setValues] = useQueryStates(parsers, { history: 'replace' });

  // Cambiar un filtro siempre vuelve a la primera página: la actual puede no existir con el
  // filtro nuevo. Lo vacío sale de la URL.
  const setFilter = useCallback(
    (patch: FilterPatch) =>
      void setValues({
        ...patch,
        ...(patch.q !== undefined && { q: patch.q || null }),
        ...(patch.mine !== undefined && { mine: patch.mine || null }),
        page: null,
      }),
    [setValues],
  );

  const setPage = useCallback(
    (page: number) => void setValues({ page: page > 1 ? page : null }),
    [setValues],
  );

  const clearFilters = useCallback(
    () =>
      void setValues({
        q: null,
        status: null,
        mine: null,
        client_id: null,
        page: null,
      }),
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

  const scope: SummaryFilters = {
    assignedTo: values.mine ? user.id : null,
    clientId,
  };

  return {
    search: values.q,
    q: values.q.trim(),
    status: values.status,
    mine: values.mine,
    page: Math.max(values.page, 1),
    scope,
    setFilter,
    setPage,
    clearFilters,
  };
}

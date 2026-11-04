'use client';

import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import { useCallback } from 'react';

import type {
  SupplierCategory,
  SupplierListFilters,
  SupplierStatusFilter,
} from './api';
import { SUPPLIER_CATEGORIES } from './categories';

const STATUSES = [
  'active',
  'inactive',
  'all',
] as const satisfies SupplierStatusFilter[];

const parsers = {
  q: parseAsString.withDefault(''),
  category: parseAsStringLiteral(SUPPLIER_CATEGORIES),
  // Sin `status` en la URL se ven los activos: el valor por defecto no se escribe.
  status: parseAsStringLiteral(STATUSES).withDefault('active'),
  page: parseAsInteger.withDefault(1),
};

type FilterPatch = {
  q?: string;
  category?: SupplierCategory | null;
  status?: SupplierStatusFilter;
};

// Filtros y página en la URL: un enlace copiado o una recarga muestran la misma lista.
// `replace` para que cada filtro no agregue una entrada al historial del navegador.
export function useSupplierFilters() {
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
    () => void setValues({ q: null, category: null, status: null, page: null }),
    [setValues],
  );

  const filters: SupplierListFilters = {
    q: values.q.trim(),
    category: values.category,
    status: values.status,
    page: Math.max(values.page, 1),
  };
  const hasFilters =
    filters.q !== '' ||
    filters.category !== null ||
    filters.status !== 'active';

  return {
    search: values.q,
    filters,
    hasFilters,
    setFilter,
    setPage,
    clearFilters,
  };
}

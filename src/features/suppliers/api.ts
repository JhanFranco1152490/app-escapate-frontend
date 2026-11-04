import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { withQuery } from '@/lib/api/query-string';
import type { components } from '@/lib/api/schema';

export type SupplierListItem = components['schemas']['SupplierListItem'];
export type SupplierDetail = components['schemas']['SupplierDetail'];
export type SupplierCreate = components['schemas']['SupplierCreate'];
export type SupplierUpdate = components['schemas']['SupplierUpdate'];
export type SupplierCategory = components['schemas']['SupplierCategory'];
export type SupplierDocumentType =
  components['schemas']['SupplierDocumentType'];
export type SupplierStatusFilter =
  components['schemas']['SupplierStatusFilter'];
export type SupplierPage = components['schemas']['Page_SupplierListItem_'];

export type SupplierListFilters = {
  q: string;
  category: SupplierCategory | null;
  status: SupplierStatusFilter;
  page: number;
};

export const SUPPLIERS_PAGE_SIZE = 20;

const fetchSuppliers = (filters: SupplierListFilters) =>
  apiFetch<SupplierPage>(
    withQuery('/api/suppliers', {
      q: filters.q,
      category: filters.category,
      status: filters.status,
      page: filters.page,
      page_size: SUPPLIERS_PAGE_SIZE,
    }),
  );

const fetchSupplier = (id: number) =>
  apiFetch<SupplierDetail>(`/api/suppliers/${id}`);

const createSupplier = (body: SupplierCreate) =>
  apiFetch<SupplierDetail>('/api/suppliers', { method: 'POST', body });

const updateSupplier = (id: number, body: SupplierUpdate) =>
  apiFetch<SupplierDetail>(`/api/suppliers/${id}`, { method: 'PUT', body });

const changeSupplierStatus = (
  id: number,
  action: 'deactivate' | 'activate',
  expectedVersion: number,
) =>
  apiFetch<SupplierDetail>(`/api/suppliers/${id}/${action}`, {
    method: 'POST',
    body: { expected_version: expectedVersion },
  });

export function useSuppliers(filters: SupplierListFilters) {
  return useQuery({
    queryKey: queryKeys.suppliers.list(filters),
    queryFn: () => fetchSuppliers(filters),
    // Al cambiar de página o de filtro, la tabla anterior sigue a la vista hasta que llega
    // la nueva, en vez de parpadear con el esqueleto.
    placeholderData: keepPreviousData,
  });
}

export function useSupplier(id: number | null) {
  return useQuery({
    queryKey: queryKeys.suppliers.detail(id ?? 0),
    queryFn: () => fetchSupplier(id!),
    enabled: id !== null,
  });
}

// Deja la ficha guardada en la caché y marca las listas como viejas.
function useStoreSupplier() {
  const queryClient = useQueryClient();
  return (supplier: SupplierDetail) => {
    queryClient.setQueryData(queryKeys.suppliers.detail(supplier.id), supplier);
    void queryClient.invalidateQueries({
      queryKey: queryKeys.suppliers.lists(),
    });
  };
}

export function useCreateSupplier() {
  return useMutation({
    mutationFn: createSupplier,
    onSuccess: useStoreSupplier(),
  });
}

export function useUpdateSupplier(id: number) {
  return useMutation({
    mutationFn: (body: SupplierUpdate) => updateSupplier(id, body),
    onSuccess: useStoreSupplier(),
  });
}

// Desactivar y activar piden la versión de la ficha que se está mirando: así nadie cambia el
// estado con datos viejos.
export function useChangeSupplierStatus(id: number) {
  return useMutation({
    mutationFn: (input: {
      action: 'deactivate' | 'activate';
      expectedVersion: number;
    }) => changeSupplierStatus(id, input.action, input.expectedVersion),
    onSuccess: useStoreSupplier(),
  });
}

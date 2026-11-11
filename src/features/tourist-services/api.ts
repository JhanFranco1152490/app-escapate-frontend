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

type Schemas = components['schemas'];

export type TouristServiceListItem = Schemas['TouristServiceListItem'];
export type TouristServiceDetail = Schemas['TouristServiceDetail'];
export type TouristServiceCreate = Schemas['TouristServiceCreate'];
export type TouristServiceUpdate = Schemas['TouristServiceUpdate'];
// El tipo de un servicio es una de las clasificaciones de su proveedor: la misma lista.
export type ServiceType = Schemas['SupplierCategory'];
export type TouristServicePage = Schemas['Page_TouristServiceListItem_'];

export const SERVICES_PAGE_SIZE = 20;

type StatusAction = 'deactivate' | 'activate';

const fetchSupplierServices = (supplierId: number, page: number) =>
  apiFetch<TouristServicePage>(
    withQuery(`/api/suppliers/${supplierId}/tourist-services`, {
      page,
      page_size: SERVICES_PAGE_SIZE,
    }),
  );

const fetchTouristService = (id: number) =>
  apiFetch<TouristServiceDetail>(`/api/tourist-services/${id}`);

const createTouristService = (supplierId: number, body: TouristServiceCreate) =>
  apiFetch<TouristServiceDetail>(
    `/api/suppliers/${supplierId}/tourist-services`,
    { method: 'POST', body },
  );

const updateTouristService = (id: number, body: TouristServiceUpdate) =>
  apiFetch<TouristServiceDetail>(`/api/tourist-services/${id}`, {
    method: 'PUT',
    body,
  });

const changeTouristServiceStatus = (
  id: number,
  action: StatusAction,
  expectedVersion: number,
) =>
  apiFetch<TouristServiceDetail>(`/api/tourist-services/${id}/${action}`, {
    method: 'POST',
    body: { expected_version: expectedVersion },
  });

export function useSupplierServices(
  supplierId: number,
  page: number,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.touristServices.list(supplierId, page),
    queryFn: () => fetchSupplierServices(supplierId, page),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useTouristService(id: number | null) {
  return useQuery({
    queryKey: queryKeys.touristServices.detail(id ?? 0),
    queryFn: () => fetchTouristService(id!),
    enabled: id !== null,
  });
}

// Deja la ficha guardada en la caché y marca como viejas las listas de servicios y la de
// proveedores, que cuenta los servicios activos de cada uno.
function useStoreTouristService() {
  const queryClient = useQueryClient();
  return (service: TouristServiceDetail) => {
    queryClient.setQueryData(
      queryKeys.touristServices.detail(service.id),
      service,
    );
    void queryClient.invalidateQueries({
      queryKey: queryKeys.touristServices.lists(),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.suppliers.lists(),
    });
  };
}

export function useCreateTouristService(supplierId: number) {
  return useMutation({
    mutationFn: (body: TouristServiceCreate) =>
      createTouristService(supplierId, body),
    onSuccess: useStoreTouristService(),
  });
}

export function useUpdateTouristService(id: number) {
  return useMutation({
    mutationFn: (body: TouristServiceUpdate) => updateTouristService(id, body),
    onSuccess: useStoreTouristService(),
  });
}

// Desactivar y activar piden la versión de la ficha que se está mirando: así nadie cambia el
// estado con datos viejos.
export function useChangeTouristServiceStatus(id: number) {
  return useMutation({
    mutationFn: (input: { action: StatusAction; expectedVersion: number }) =>
      changeTouristServiceStatus(id, input.action, input.expectedVersion),
    onSuccess: useStoreTouristService(),
  });
}

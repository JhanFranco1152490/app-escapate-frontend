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

export type ServiceRate = Schemas['ServiceRate'];
export type ServiceRateCreate = Schemas['ServiceRateCreate'];
export type ServiceRateUpdate = Schemas['ServiceRateUpdate'];
export type ChargeUnit = Schemas['ChargeUnit'];
export type RateValidity = Schemas['RateValidity'];
export type ServiceRatePage = Schemas['Page_ServiceRate_'];

// Un servicio rara vez tiene más de unas pocas tarifas: se piden todas de una vez y la
// paginación solo aparece si pasa de aquí.
export const RATES_PAGE_SIZE = 100;

const ratesPath = (serviceId: number) =>
  `/api/tourist-services/${serviceId}/rates`;

const fetchServiceRates = (serviceId: number, page: number) =>
  apiFetch<ServiceRatePage>(
    withQuery(ratesPath(serviceId), { page, page_size: RATES_PAGE_SIZE }),
  );

const createRate = (serviceId: number, body: ServiceRateCreate) =>
  apiFetch<ServiceRate>(ratesPath(serviceId), { method: 'POST', body });

const updateRate = (
  serviceId: number,
  rateId: number,
  body: ServiceRateUpdate,
) =>
  apiFetch<ServiceRate>(`${ratesPath(serviceId)}/${rateId}`, {
    method: 'PUT',
    body,
  });

const deleteRate = (
  serviceId: number,
  rateId: number,
  expectedVersion: number,
) =>
  apiFetch<void>(
    withQuery(`${ratesPath(serviceId)}/${rateId}`, {
      expected_version: expectedVersion,
    }),
    { method: 'DELETE' },
  );

export function useServiceRates(serviceId: number, page: number) {
  return useQuery({
    queryKey: queryKeys.touristServices.ratesPage(serviceId, page),
    queryFn: () => fetchServiceRates(serviceId, page),
    placeholderData: keepPreviousData,
  });
}

// Un cambio en las tarifas mueve la tabla, el conteo de vigentes de la ficha del servicio y
// el de su fila en la ficha del proveedor.
function useRefreshRates(serviceId: number) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      [
        queryKeys.touristServices.rates(serviceId),
        queryKeys.touristServices.detail(serviceId),
        queryKeys.touristServices.lists(),
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );
}

export function useCreateRate(serviceId: number) {
  return useMutation({
    mutationFn: (body: ServiceRateCreate) => createRate(serviceId, body),
    onSuccess: useRefreshRates(serviceId),
  });
}

export function useUpdateRate(serviceId: number) {
  return useMutation({
    mutationFn: (input: { rateId: number; body: ServiceRateUpdate }) =>
      updateRate(serviceId, input.rateId, input.body),
    onSuccess: useRefreshRates(serviceId),
  });
}

export function useDeleteRate(serviceId: number) {
  return useMutation({
    mutationFn: (input: { rateId: number; expectedVersion: number }) =>
      deleteRate(serviceId, input.rateId, input.expectedVersion),
    onSuccess: useRefreshRates(serviceId),
  });
}

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

export type TravelerListItem = components['schemas']['TravelerListItem'];
export type TravelerDetail = components['schemas']['TravelerDetail'];
export type TravelerCreate = components['schemas']['TravelerCreate'];
export type TravelerUpdate = components['schemas']['TravelerUpdate'];
export type TravelerDocumentType =
  components['schemas']['TravelerDocumentType'];
export type TravelerPage = components['schemas']['Page_TravelerListItem_'];

export type TravelerListFilters = {
  q: string;
  clientId: number | null;
  page: number;
};

export const TRAVELERS_PAGE_SIZE = 20;

const fetchTravelers = (filters: TravelerListFilters) =>
  apiFetch<TravelerPage>(
    withQuery('/api/travelers', {
      q: filters.q,
      client_id: filters.clientId,
      page: filters.page,
      page_size: TRAVELERS_PAGE_SIZE,
    }),
  );

const fetchTraveler = (id: number) =>
  apiFetch<TravelerDetail>(`/api/travelers/${id}`);

const createTraveler = (body: TravelerCreate) =>
  apiFetch<TravelerDetail>('/api/travelers', { method: 'POST', body });

const updateTraveler = (id: number, body: TravelerUpdate) =>
  apiFetch<TravelerDetail>(`/api/travelers/${id}`, { method: 'PUT', body });

export function useTravelers(filters: TravelerListFilters) {
  return useQuery({
    queryKey: queryKeys.travelers.list(filters),
    queryFn: () => fetchTravelers(filters),
    placeholderData: keepPreviousData,
  });
}

export function useTraveler(id: number | null) {
  return useQuery({
    queryKey: queryKeys.travelers.detail(id ?? 0),
    queryFn: () => fetchTraveler(id!),
    enabled: id !== null,
  });
}

// Deja la ficha guardada en la caché y marca las listas como viejas, incluida la de los
// viajeros de referencia en la ficha del cliente.
function useStoreTraveler() {
  const queryClient = useQueryClient();
  return (traveler: TravelerDetail) => {
    queryClient.setQueryData(queryKeys.travelers.detail(traveler.id), traveler);
    void queryClient.invalidateQueries({
      queryKey: queryKeys.travelers.lists(),
    });
  };
}

export function useCreateTraveler() {
  const storeTraveler = useStoreTraveler();
  return useMutation({ mutationFn: createTraveler, onSuccess: storeTraveler });
}

export function useUpdateTraveler(id: number) {
  const storeTraveler = useStoreTraveler();
  return useMutation({
    mutationFn: (body: TravelerUpdate) => updateTraveler(id, body),
    onSuccess: storeTraveler,
  });
}

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';
import { queryKeys } from '@/lib/api/query-keys';
import type { components } from '@/lib/api/schema';

export type RequestTraveler = components['schemas']['RequestTraveler'];
export type RequestTravelersAdd = components['schemas']['RequestTravelersAdd'];

// La API acepta de 1 a 50 viajeros por petición.
export const MAX_TRAVELERS_PER_ADD = 50;

const fetchRequestTravelers = (requestId: number) =>
  apiFetch<RequestTraveler[]>(`/api/travel-requests/${requestId}/travelers`);

const addRequestTravelers = (requestId: number, body: RequestTravelersAdd) =>
  apiFetch<RequestTraveler[]>(`/api/travel-requests/${requestId}/travelers`, {
    method: 'POST',
    body,
  });

const removeRequestTraveler = (requestId: number, travelerId: number) =>
  apiFetch<void>(`/api/travel-requests/${requestId}/travelers/${travelerId}`, {
    method: 'DELETE',
  });

// `enabled` aparte: la API pide además `travelers.view`, y sin ese permiso no se pide.
export function useRequestTravelers(
  requestId: number,
  { enabled }: { enabled: boolean },
) {
  return useQuery({
    queryKey: queryKeys.travelRequests.travelers(requestId),
    queryFn: () => fetchRequestTravelers(requestId),
    enabled,
  });
}

// Un 409 quiere decir que la solicitud ya no admite cambios (otra persona la cerró): se pide
// la ficha de nuevo para que la pantalla deje de ofrecer agregar y quitar.
function refreshRequestOnConflict(
  queryClient: QueryClient,
  requestId: number,
  error: Error,
) {
  if (isApiError(error) && error.status === 409) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.travelRequests.detail(requestId),
    });
  }
}

// Asociar y quitar no tocan la solicitud: ni su versión ni su fecha de modificación, así que
// la ficha, las listas y los conteos siguen vigentes.
export function useAddRequestTravelers(requestId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RequestTravelersAdd) =>
      addRequestTravelers(requestId, body),
    // La API devuelve la lista completa, en el orden en que se asociaron.
    onSuccess: (travelers) =>
      queryClient.setQueryData(
        queryKeys.travelRequests.travelers(requestId),
        travelers,
      ),
    onError: (error) => refreshRequestOnConflict(queryClient, requestId, error),
  });
}

export function useRemoveRequestTraveler(requestId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (travelerId: number) =>
      removeRequestTraveler(requestId, travelerId),
    onSuccess: (_, travelerId) =>
      queryClient.setQueryData<RequestTraveler[]>(
        queryKeys.travelRequests.travelers(requestId),
        (travelers) =>
          travelers?.filter((traveler) => traveler.id !== travelerId),
      ),
    onError: (error) => refreshRequestOnConflict(queryClient, requestId, error),
  });
}

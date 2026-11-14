import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';
import { queryKeys } from '@/lib/api/query-keys';

import type {
  TravelRequestClose,
  TravelRequestCreate,
  TravelRequestDetail,
  TravelRequestReopen,
  TravelRequestUpdate,
} from './api';

const createTravelRequest = (body: TravelRequestCreate) =>
  apiFetch<TravelRequestDetail>('/api/travel-requests', {
    method: 'POST',
    body,
  });

const updateTravelRequest = (id: number, body: TravelRequestUpdate) =>
  apiFetch<TravelRequestDetail>(`/api/travel-requests/${id}`, {
    method: 'PUT',
    body,
  });

const closeTravelRequest = (id: number, body: TravelRequestClose) =>
  apiFetch<TravelRequestDetail>(`/api/travel-requests/${id}/close`, {
    method: 'POST',
    body,
  });

const reopenTravelRequest = (id: number, body: TravelRequestReopen) =>
  apiFetch<TravelRequestDetail>(`/api/travel-requests/${id}/reopen`, {
    method: 'POST',
    body,
  });

// Deja la ficha guardada en la caché y marca como viejas las listas y los conteos: cualquier
// cambio puede mover la solicitud de pestaña o sacarla de "Por cotizar".
function useStoreTravelRequest() {
  const queryClient = useQueryClient();
  return (request: TravelRequestDetail) => {
    queryClient.setQueryData(
      queryKeys.travelRequests.detail(request.id),
      request,
    );
    void queryClient.invalidateQueries({
      queryKey: queryKeys.travelRequests.lists(),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.travelRequests.summaries(),
    });
  };
}

export function useCreateTravelRequest() {
  const store = useStoreTravelRequest();
  return useMutation({ mutationFn: createTravelRequest, onSuccess: store });
}

export function useUpdateTravelRequest(id: number) {
  const store = useStoreTravelRequest();
  return useMutation({
    mutationFn: (body: TravelRequestUpdate) => updateTravelRequest(id, body),
    onSuccess: store,
  });
}

// Un 409 al cerrar o reabrir quiere decir que la ficha que se mira ya no es la vigente (otra
// persona la editó, la cerró o la reabrió): se pide de nuevo para que el siguiente intento
// vaya con la versión actual.
function useRefreshOnConflict(id: number) {
  const queryClient = useQueryClient();
  return (error: Error) => {
    if (isApiError(error) && error.status === 409) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.travelRequests.detail(id),
      });
    }
  };
}

export function useCloseTravelRequest(id: number) {
  const store = useStoreTravelRequest();
  const refreshOnConflict = useRefreshOnConflict(id);
  return useMutation({
    mutationFn: (body: TravelRequestClose) => closeTravelRequest(id, body),
    onSuccess: store,
    onError: refreshOnConflict,
  });
}

export function useReopenTravelRequest(id: number) {
  const store = useStoreTravelRequest();
  const refreshOnConflict = useRefreshOnConflict(id);
  return useMutation({
    mutationFn: (body: TravelRequestReopen) => reopenTravelRequest(id, body),
    onSuccess: store,
    onError: refreshOnConflict,
  });
}

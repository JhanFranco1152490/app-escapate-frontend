import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';
import { queryKeys } from '@/lib/api/query-keys';

import type {
  QuoteConditionsUpdate,
  QuoteDetail,
  QuoteGeneralUpdate,
  QuotePricingUpdate,
  QuoteItem,
  QuoteItemCreate,
  QuoteItemUpdate,
} from './api';

export type QuoteTransition = 'send' | 'return-to-draft' | 'accept' | 'reject';

// Deja la ficha guardada en la caché y marca como viejas las listas. Crear una cotización
// también cambia el estado de su solicitud.
function useStoreQuote() {
  const queryClient = useQueryClient();
  return (quote: QuoteDetail) => {
    queryClient.setQueryData(queryKeys.quotes.detail(quote.id), quote);
    void queryClient.invalidateQueries({ queryKey: queryKeys.quotes.lists() });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.travelRequests.all(),
    });
  };
}

// Un 409 quiere decir que la ficha que se mira ya no es la vigente: se pide de nuevo para que
// el siguiente intento vaya con el estado y la versión actuales.
function useRefreshOnConflict(id: number) {
  const queryClient = useQueryClient();
  return (error: Error) => {
    if (isApiError(error) && error.status === 409) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.quotes.detail(id),
      });
    }
  };
}

export function useCreateQuote() {
  const store = useStoreQuote();
  return useMutation({
    mutationFn: (travelRequestId: number) =>
      apiFetch<QuoteDetail>('/api/quotes', {
        method: 'POST',
        body: { travel_request_id: travelRequestId },
      }),
    onSuccess: store,
  });
}

export function useUpdateQuoteGeneral(id: number) {
  const store = useStoreQuote();
  return useMutation({
    mutationFn: (body: QuoteGeneralUpdate) =>
      apiFetch<QuoteDetail>(`/api/quotes/${id}`, { method: 'PUT', body }),
    onSuccess: store,
  });
}

export function useUpdateQuoteConditions(id: number) {
  const store = useStoreQuote();
  return useMutation({
    mutationFn: (body: QuoteConditionsUpdate) =>
      apiFetch<QuoteDetail>(`/api/quotes/${id}/conditions`, {
        method: 'PUT',
        body,
      }),
    onSuccess: store,
  });
}

export function useUpdateQuotePricing(id: number) {
  const store = useStoreQuote();
  const refreshOnConflict = useRefreshOnConflict(id);
  return useMutation({
    mutationFn: (body: QuotePricingUpdate) =>
      apiFetch<QuoteDetail>(`/api/quotes/${id}/pricing`, {
        method: 'PUT',
        body,
      }),
    onSuccess: store,
    onError: refreshOnConflict,
  });
}

export function useQuoteTransition(id: number) {
  const store = useStoreQuote();
  const refreshOnConflict = useRefreshOnConflict(id);
  return useMutation({
    mutationFn: ({
      action,
      version,
    }: {
      action: QuoteTransition;
      version: number;
    }) =>
      apiFetch<QuoteDetail>(`/api/quotes/${id}/${action}`, {
        method: 'POST',
        body: { expected_version: version },
      }),
    onSuccess: store,
    onError: refreshOnConflict,
  });
}

// Los servicios cuelgan de la ficha: después de cada cambio se vuelve a pedir entera.
function useRefreshQuote(id: number) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.quotes.detail(id) });
}

export function useAddQuoteItem(quoteId: number) {
  const refresh = useRefreshQuote(quoteId);
  return useMutation({
    mutationFn: (body: QuoteItemCreate) =>
      apiFetch<QuoteItem>(`/api/quotes/${quoteId}/items`, {
        method: 'POST',
        body,
      }),
    onSuccess: refresh,
  });
}

export function useUpdateQuoteItem(quoteId: number) {
  const refresh = useRefreshQuote(quoteId);
  return useMutation({
    mutationFn: ({ itemId, body }: { itemId: number; body: QuoteItemUpdate }) =>
      apiFetch<QuoteItem>(`/api/quotes/${quoteId}/items/${itemId}`, {
        method: 'PUT',
        body,
      }),
    onSuccess: refresh,
  });
}

export function useRemoveQuoteItem(quoteId: number) {
  const refresh = useRefreshQuote(quoteId);
  return useMutation({
    mutationFn: (itemId: number) =>
      apiFetch<void>(`/api/quotes/${quoteId}/items/${itemId}`, {
        method: 'DELETE',
      }),
    onSuccess: refresh,
  });
}

// Devuelve la cotización completa: el cambio mueve varios servicios y el total.
export function useChooseAlternative(quoteId: number) {
  const store = useStoreQuote();
  return useMutation({
    mutationFn: (itemId: number) =>
      apiFetch<QuoteDetail>(`/api/quotes/${quoteId}/items/${itemId}/choose`, {
        method: 'POST',
      }),
    onSuccess: store,
  });
}

export function useCopyQuote(id: number) {
  const store = useStoreQuote();
  return useMutation({
    mutationFn: (asNewVersion: boolean) =>
      apiFetch<QuoteDetail>(`/api/quotes/${id}/copy`, {
        method: 'POST',
        body: { as_new_version: asNewVersion },
      }),
    onSuccess: store,
  });
}

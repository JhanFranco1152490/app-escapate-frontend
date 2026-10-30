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

export type ClientListItem = components['schemas']['ClientListItem'];
export type ClientDetail = components['schemas']['ClientDetail'];
export type ClientCreate = components['schemas']['ClientCreate'];
export type ClientUpdate = components['schemas']['ClientUpdate'];
export type ClientType = components['schemas']['ClientType'];
export type ClientDocumentType = components['schemas']['ClientDocumentType'];
export type ContactSource = components['schemas']['ContactSource'];
export type ClientPage = components['schemas']['Page_ClientListItem_'];

// Los viajeros de referencia de un cliente. Se piden aquí, con su propio fetcher, y no con la
// API de viajeros: ese dominio ya depende de este y la dependencia inversa sería un ciclo.
export type ClientTravelerItem = components['schemas']['TravelerListItem'];
type ClientTravelerPage = components['schemas']['Page_TravelerListItem_'];

export type ClientListFilters = {
  q: string;
  clientType: ClientType | null;
  page: number;
};

export const CLIENTS_PAGE_SIZE = 20;
// El máximo que da la API por página: un cliente no tiene tantos acompañantes habituales, así
// que con una sola página se sabe si alguno ya es su propia ficha de viajero.
export const CLIENT_TRAVELERS_PAGE_SIZE = 100;

const fetchClients = (filters: ClientListFilters) =>
  apiFetch<ClientPage>(
    withQuery('/api/clients', {
      q: filters.q,
      client_type: filters.clientType,
      page: filters.page,
      page_size: CLIENTS_PAGE_SIZE,
    }),
  );

const fetchClient = (id: number) =>
  apiFetch<ClientDetail>(`/api/clients/${id}`);

const fetchClientTravelers = (clientId: number) =>
  apiFetch<ClientTravelerPage>(
    withQuery('/api/travelers', {
      client_id: clientId,
      page_size: CLIENT_TRAVELERS_PAGE_SIZE,
    }),
  );

const createClient = (body: ClientCreate) =>
  apiFetch<ClientDetail>('/api/clients', { method: 'POST', body });

const updateClient = (id: number, body: ClientUpdate) =>
  apiFetch<ClientDetail>(`/api/clients/${id}`, { method: 'PUT', body });

export function useClients(
  filters: ClientListFilters,
  { enabled = true } = {},
) {
  return useQuery({
    queryKey: queryKeys.clients.list(filters),
    queryFn: () => fetchClients(filters),
    enabled,
    // Al cambiar de página o de filtro, la tabla anterior sigue a la vista hasta que llega
    // la nueva, en vez de parpadear con el esqueleto.
    placeholderData: keepPreviousData,
  });
}

export function useClient(id: number | null) {
  return useQuery({
    queryKey: queryKeys.clients.detail(id ?? 0),
    queryFn: () => fetchClient(id!),
    enabled: id !== null,
  });
}

// Bajo las listas de viajeros: cualquier alta o edición de un viajero la invalida.
export function useClientTravelers(clientId: number, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.travelers.list({ client_id: clientId }),
    queryFn: () => fetchClientTravelers(clientId),
    enabled,
  });
}

// Deja la ficha guardada en la caché y marca las listas como viejas.
function useStoreClient() {
  const queryClient = useQueryClient();
  return (client: ClientDetail) => {
    queryClient.setQueryData(queryKeys.clients.detail(client.id), client);
    void queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() });
  };
}

export function useCreateClient() {
  const storeClient = useStoreClient();
  return useMutation({ mutationFn: createClient, onSuccess: storeClient });
}

export function useUpdateClient(id: number) {
  const queryClient = useQueryClient();
  const storeClient = useStoreClient();
  return useMutation({
    mutationFn: (body: ClientUpdate) => updateClient(id, body),
    onSuccess: (client) => {
      storeClient(client);
      // La lista y la ficha de viajeros muestran el nombre de su cliente de referencia.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.travelers.all(),
      });
    },
  });
}

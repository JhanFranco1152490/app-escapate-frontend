import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@/lib/api/query-keys';
import {
  buildClientDetail,
  buildClientListItem,
  buildPage,
  buildTravelerListItem,
} from '@/test/clients';
import { apiUrl } from '@/test/handlers';
import { renderHookWithProviders } from '@/test/render';
import { server } from '@/test/server';

import {
  useClient,
  useClients,
  useCreateClient,
  useUpdateClient,
  type ClientCreate,
} from './api';

const clientInput: ClientCreate = {
  client_type: 'person',
  first_name: 'Marcela',
  last_name: 'Gómez Ortiz',
  phone: '+573001112233',
  contact_source: 'whatsapp',
  data_consent: true,
};

describe('consultas', () => {
  it('useClients envía los filtros y omite los vacíos', async () => {
    const page = buildPage([buildClientListItem()]);
    let url: URL | undefined;
    server.use(
      http.get(apiUrl('/api/clients'), ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json(page);
      }),
    );

    const { result } = renderHookWithProviders(() =>
      useClients({ q: 'gomez', clientType: 'person', page: 2 }),
    );

    await waitFor(() => expect(result.current.data).toEqual(page));
    expect(Object.fromEntries(url!.searchParams)).toEqual({
      q: 'gomez',
      client_type: 'person',
      page: '2',
      page_size: '20',
    });
  });

  it('useClients sin filtros no envía q ni client_type', async () => {
    let url: URL | undefined;
    server.use(
      http.get(apiUrl('/api/clients'), ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json(buildPage([]));
      }),
    );

    const { result } = renderHookWithProviders(() =>
      useClients({ q: '', clientType: null, page: 1 }),
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(url!.searchParams.has('q')).toBe(false);
    expect(url!.searchParams.has('client_type')).toBe(false);
  });

  it('useClients deshabilitado no llama a la API', () => {
    const { result } = renderHookWithProviders(() =>
      useClients({ q: '', clientType: null, page: 1 }, { enabled: false }),
    );

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('useClient pide el cliente indicado', async () => {
    const client = buildClientDetail();
    server.use(
      http.get(apiUrl('/api/clients/12'), () => HttpResponse.json(client)),
    );

    const { result } = renderHookWithProviders(() => useClient(12));

    await waitFor(() => expect(result.current.data).toEqual(client));
  });

  it('useClient sin id no llama a la API', () => {
    const { result } = renderHookWithProviders(() => useClient(null));

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('mutaciones', () => {
  it('crear guarda el cliente en la caché e invalida la lista', async () => {
    const client = buildClientDetail();
    let received: unknown;
    server.use(
      http.post(apiUrl('/api/clients'), async ({ request }) => {
        received = await request.json();
        return HttpResponse.json(client, { status: 201 });
      }),
    );
    const { result, queryClient } = renderHookWithProviders(() =>
      useCreateClient(),
    );
    const listKey = queryKeys.clients.list({ q: '' });
    queryClient.setQueryData(listKey, buildPage([]));

    await result.current.mutateAsync(clientInput);

    expect(received).toEqual(clientInput);
    expect(queryClient.getQueryData(queryKeys.clients.detail(12))).toEqual(
      client,
    );
    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true);
  });

  it('editar invalida también los viajeros, que muestran el nombre del cliente', async () => {
    const client = buildClientDetail({ version: 2 });
    server.use(
      http.put(apiUrl('/api/clients/12'), () => HttpResponse.json(client)),
    );
    const { result, queryClient } = renderHookWithProviders(() =>
      useUpdateClient(12),
    );
    const travelersKey = queryKeys.travelers.list({ q: '' });
    queryClient.setQueryData(
      travelersKey,
      buildPage([buildTravelerListItem()]),
    );

    await result.current.mutateAsync({ ...clientInput, expected_version: 1 });

    expect(queryClient.getQueryData(queryKeys.clients.detail(12))).toEqual(
      client,
    );
    expect(queryClient.getQueryState(travelersKey)?.isInvalidated).toBe(true);
  });
});

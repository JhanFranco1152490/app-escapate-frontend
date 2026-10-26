import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@/lib/api/query-keys';
import {
  buildPage,
  buildTravelerDetail,
  buildTravelerListItem,
} from '@/test/clients';
import { apiUrl } from '@/test/handlers';
import { renderHookWithProviders } from '@/test/render';
import { server } from '@/test/server';

import {
  useCreateTraveler,
  useTraveler,
  useTravelers,
  useUpdateTraveler,
  type TravelerCreate,
} from './api';

const travelerInput: TravelerCreate = {
  first_name: 'Sofía',
  last_name: 'Gómez Ruiz',
  document_type: 'TI',
  document_number: '1090123456',
  birth_date: '2014-03-12',
  nationality: 'CO',
  reference_client_id: 12,
  is_the_client: false,
  data_consent: true,
};

describe('consultas', () => {
  it('useTravelers envía la búsqueda y el cliente de referencia', async () => {
    const page = buildPage([buildTravelerListItem()]);
    let url: URL | undefined;
    server.use(
      http.get(apiUrl('/api/travelers'), ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json(page);
      }),
    );

    const { result } = renderHookWithProviders(() =>
      useTravelers({ q: 'sofia', clientId: 12, page: 1 }),
    );

    await waitFor(() => expect(result.current.data).toEqual(page));
    expect(Object.fromEntries(url!.searchParams)).toEqual({
      q: 'sofia',
      client_id: '12',
      page: '1',
      page_size: '20',
    });
  });

  it('useTraveler pide el viajero indicado', async () => {
    const traveler = buildTravelerDetail();
    server.use(
      http.get(apiUrl('/api/travelers/30'), () => HttpResponse.json(traveler)),
    );

    const { result } = renderHookWithProviders(() => useTraveler(30));

    await waitFor(() => expect(result.current.data).toEqual(traveler));
  });

  it('useTraveler sin id no llama a la API', () => {
    const { result } = renderHookWithProviders(() => useTraveler(null));

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('mutaciones', () => {
  it('crear guarda el viajero en la caché e invalida las listas de viajeros', async () => {
    const traveler = buildTravelerDetail();
    let received: unknown;
    server.use(
      http.post(apiUrl('/api/travelers'), async ({ request }) => {
        received = await request.json();
        return HttpResponse.json(traveler, { status: 201 });
      }),
    );
    const { result, queryClient } = renderHookWithProviders(() =>
      useCreateTraveler(),
    );
    // También la lista que pide la ficha del cliente para sus viajeros de referencia.
    const clientTravelersKey = queryKeys.travelers.list({ client_id: 12 });
    queryClient.setQueryData(clientTravelersKey, buildPage([]));

    await result.current.mutateAsync(travelerInput);

    expect(received).toEqual(travelerInput);
    expect(queryClient.getQueryData(queryKeys.travelers.detail(30))).toEqual(
      traveler,
    );
    expect(queryClient.getQueryState(clientTravelersKey)?.isInvalidated).toBe(
      true,
    );
  });

  it('editar guarda la ficha nueva e invalida las listas', async () => {
    const traveler = buildTravelerDetail({ version: 2 });
    server.use(
      http.put(apiUrl('/api/travelers/30'), () => HttpResponse.json(traveler)),
    );
    const { result, queryClient } = renderHookWithProviders(() =>
      useUpdateTraveler(30),
    );
    const listKey = queryKeys.travelers.list({ q: '' });
    queryClient.setQueryData(listKey, buildPage([buildTravelerListItem()]));

    await result.current.mutateAsync({
      ...travelerInput,
      expected_version: 1,
    });

    expect(queryClient.getQueryData(queryKeys.travelers.detail(30))).toEqual(
      traveler,
    );
    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true);
  });
});

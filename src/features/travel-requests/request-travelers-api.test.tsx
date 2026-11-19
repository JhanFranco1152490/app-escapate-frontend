import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@/lib/api/query-keys';
import { apiUrl } from '@/test/handlers';
import { createTestQueryClient, renderHookWithProviders } from '@/test/render';
import { server } from '@/test/server';
import {
  buildRequestMinor,
  buildRequestTraveler,
} from '@/test/travel-requests';

import {
  useAddRequestTravelers,
  useRemoveRequestTraveler,
  useRequestTravelers,
} from './request-travelers-api';

const PATH = '/api/travel-requests/231/travelers';
const KEY = queryKeys.travelRequests.travelers(231);
const closedError = () =>
  HttpResponse.json(
    {
      detail: 'La solicitud está cerrada. Reábrela para modificarla.',
      code: 'travel_request_closed',
      fields: {},
    },
    { status: 409 },
  );

describe('useRequestTravelers', () => {
  it('pide la lista de la solicitud', async () => {
    const travelers = [buildRequestTraveler(), buildRequestMinor()];
    server.use(http.get(apiUrl(PATH), () => HttpResponse.json(travelers)));

    const { result } = renderHookWithProviders(() =>
      useRequestTravelers(231, { enabled: true }),
    );

    await waitFor(() => expect(result.current.data).toEqual(travelers));
  });

  it('sin permiso para ver viajeros no pide nada', async () => {
    // Sin handler: una petición haría fallar la prueba.
    const { result } = renderHookWithProviders(() =>
      useRequestTravelers(231, { enabled: false }),
    );

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useAddRequestTravelers', () => {
  it('envía los ids y deja en la caché la lista que devuelve la API', async () => {
    const travelers = [buildRequestTraveler(), buildRequestMinor()];
    let body: unknown;
    server.use(
      http.post(apiUrl(PATH), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(travelers);
      }),
    );
    const queryClient = createTestQueryClient();

    const { result } = renderHookWithProviders(
      () => useAddRequestTravelers(231),
      { queryClient },
    );
    result.current.mutate({ traveler_ids: [31, 30] });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(body).toEqual({ traveler_ids: [31, 30] });
    expect(queryClient.getQueryData(KEY)).toEqual(travelers);
  });

  it('con un 409 pide de nuevo la ficha de la solicitud', async () => {
    server.use(http.post(apiUrl(PATH), closedError));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKeys.travelRequests.detail(231), {});

    const { result } = renderHookWithProviders(
      () => useAddRequestTravelers(231),
      { queryClient },
    );
    result.current.mutate({ traveler_ids: [31] });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(
      queryClient.getQueryState(queryKeys.travelRequests.detail(231))
        ?.isInvalidated,
    ).toBe(true);
  });
});

describe('useRemoveRequestTraveler', () => {
  it('borra la asociación y quita a esa persona de la caché', async () => {
    let deleted = false;
    server.use(
      http.delete(apiUrl(`${PATH}/30`), () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(KEY, [
      buildRequestTraveler(),
      buildRequestMinor(),
    ]);

    const { result } = renderHookWithProviders(
      () => useRemoveRequestTraveler(231),
      { queryClient },
    );
    result.current.mutate(30);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleted).toBe(true);
    expect(queryClient.getQueryData(KEY)).toEqual([buildRequestTraveler()]);
  });

  it('con un 409 deja la lista como estaba y pide de nuevo la ficha', async () => {
    server.use(http.delete(apiUrl(`${PATH}/30`), closedError));
    const queryClient = createTestQueryClient();
    const travelers = [buildRequestTraveler(), buildRequestMinor()];
    queryClient.setQueryData(KEY, travelers);
    queryClient.setQueryData(queryKeys.travelRequests.detail(231), {});

    const { result } = renderHookWithProviders(
      () => useRemoveRequestTraveler(231),
      { queryClient },
    );
    result.current.mutate(30);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(KEY)).toEqual(travelers);
    expect(
      queryClient.getQueryState(queryKeys.travelRequests.detail(231))
        ?.isInvalidated,
    ).toBe(true);
  });
});

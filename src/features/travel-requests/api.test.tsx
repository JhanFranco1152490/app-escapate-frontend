import { waitFor } from '@testing-library/react';
import { http, HttpResponse, type JsonBodyType } from 'msw';
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@/lib/api/query-keys';
import { buildPage } from '@/test/clients';
import { apiUrl } from '@/test/handlers';
import { renderHookWithProviders } from '@/test/render';
import { server } from '@/test/server';
import {
  buildAdvisor,
  buildClosedRequestDetail,
  buildTravelRequestDetail,
  buildTravelRequestListItem,
  buildTravelRequestSummary,
} from '@/test/travel-requests';

import {
  useAdvisors,
  useCloseTravelRequest,
  useCreateTravelRequest,
  useReopenTravelRequest,
  useTravelRequest,
  useTravelRequests,
  useTravelRequestSummary,
  useUpdateTravelRequest,
  type TravelRequestCreate,
} from './api';

const requestInput: TravelRequestCreate = {
  client_id: 7,
  destination: 'San Andrés',
  date_mode: 'exact',
  departure_date: '2026-12-18',
  adults: 2,
  minors: 1,
  trip_types: [],
  assigned_to_id: 2,
};

const NO_FILTERS = {
  q: '',
  status: null,
  assignedTo: null,
  clientId: null,
  sort: 'recent',
  page: 1,
} as const;

function captureUrl(path: string, body: JsonBodyType) {
  const captured: { url?: URL } = {};
  server.use(
    http.get(apiUrl(path), ({ request }) => {
      captured.url = new URL(request.url);
      return HttpResponse.json(body);
    }),
  );
  return captured;
}

describe('consultas', () => {
  it('useTravelRequests envía los filtros con sus nombres de la API', async () => {
    const page = buildPage([buildTravelRequestListItem()]);
    const captured = captureUrl('/api/travel-requests', page);

    const { result } = renderHookWithProviders(() =>
      useTravelRequests({
        q: 'SOL-231',
        status: 'pending',
        assignedTo: 2,
        clientId: 7,
        sort: 'oldest',
        page: 2,
      }),
    );

    await waitFor(() => expect(result.current.data).toEqual(page));
    expect(Object.fromEntries(captured.url!.searchParams)).toEqual({
      q: 'SOL-231',
      status: 'pending',
      assigned_to: '2',
      client_id: '7',
      sort: 'oldest',
      page: '2',
      page_size: '20',
    });
  });

  it('useTravelRequests sin filtros solo envía el orden y la página', async () => {
    const captured = captureUrl('/api/travel-requests', buildPage([]));

    const { result } = renderHookWithProviders(() =>
      useTravelRequests(NO_FILTERS),
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Object.fromEntries(captured.url!.searchParams)).toEqual({
      sort: 'recent',
      page: '1',
      page_size: '20',
    });
  });

  it('useTravelRequestSummary envía el asesor y el cliente, no la búsqueda', async () => {
    const summary = buildTravelRequestSummary();
    const captured = captureUrl('/api/travel-requests/summary', summary);

    const { result } = renderHookWithProviders(() =>
      useTravelRequestSummary({ assignedTo: 2, clientId: null }),
    );

    await waitFor(() => expect(result.current.data).toEqual(summary));
    expect(Object.fromEntries(captured.url!.searchParams)).toEqual({
      assigned_to: '2',
    });
  });

  it('useAdvisors pide los asesores', async () => {
    const advisors = [buildAdvisor()];
    captureUrl('/api/travel-requests/advisors', advisors);

    const { result } = renderHookWithProviders(() => useAdvisors());

    await waitFor(() => expect(result.current.data).toEqual(advisors));
  });

  it('useTravelRequest pide la solicitud indicada y sin id no llama a la API', async () => {
    const request = buildTravelRequestDetail();
    captureUrl('/api/travel-requests/231', request);

    const { result } = renderHookWithProviders(() => useTravelRequest(231));
    await waitFor(() => expect(result.current.data).toEqual(request));

    const idle = renderHookWithProviders(() => useTravelRequest(null));
    expect(idle.result.current.fetchStatus).toBe('idle');
  });
});

describe('mutaciones', () => {
  // Cada mutación deja la ficha en la caché y marca como viejas las listas y los conteos.
  function seedCache(
    queryClient: ReturnType<typeof renderHookWithProviders>['queryClient'],
  ) {
    const listKey = queryKeys.travelRequests.list({ q: '' });
    const summaryKey = queryKeys.travelRequests.summary({ assignedTo: null });
    queryClient.setQueryData(listKey, buildPage([]));
    queryClient.setQueryData(summaryKey, buildTravelRequestSummary());
    return () => {
      expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(summaryKey)?.isInvalidated).toBe(true);
      expect(
        queryClient.getQueryData(queryKeys.travelRequests.detail(231)),
      ).toBeDefined();
    };
  }

  it('crear envía el cuerpo, guarda la ficha e invalida listas y conteos', async () => {
    let received: unknown;
    server.use(
      http.post(apiUrl('/api/travel-requests'), async ({ request }) => {
        received = await request.json();
        return HttpResponse.json(buildTravelRequestDetail(), { status: 201 });
      }),
    );
    const { result, queryClient } = renderHookWithProviders(() =>
      useCreateTravelRequest(),
    );
    const expectStored = seedCache(queryClient);

    await result.current.mutateAsync(requestInput);

    expect(received).toEqual(requestInput);
    expectStored();
  });

  it('editar envía la versión con la que se abrió', async () => {
    let received: unknown;
    server.use(
      http.put(apiUrl('/api/travel-requests/231'), async ({ request }) => {
        received = await request.json();
        return HttpResponse.json(buildTravelRequestDetail({ version: 2 }));
      }),
    );
    const { result, queryClient } = renderHookWithProviders(() =>
      useUpdateTravelRequest(231),
    );
    const expectStored = seedCache(queryClient);

    await result.current.mutateAsync({ ...requestInput, expected_version: 1 });

    expect(received).toEqual({ ...requestInput, expected_version: 1 });
    expectStored();
  });

  it('cerrar envía el motivo, la nota y la versión', async () => {
    let received: unknown;
    server.use(
      http.post(
        apiUrl('/api/travel-requests/231/close'),
        async ({ request }) => {
          received = await request.json();
          return HttpResponse.json(buildClosedRequestDetail());
        },
      ),
    );
    const { result, queryClient } = renderHookWithProviders(() =>
      useCloseTravelRequest(231),
    );
    const expectStored = seedCache(queryClient);
    const body = {
      reason: 'other',
      note: 'Viaje aplazado.',
      expected_version: 1,
    } as const;

    await result.current.mutateAsync(body);

    expect(received).toEqual(body);
    expectStored();
  });

  it('reabrir envía la versión', async () => {
    let received: unknown;
    server.use(
      http.post(
        apiUrl('/api/travel-requests/231/reopen'),
        async ({ request }) => {
          received = await request.json();
          return HttpResponse.json(buildTravelRequestDetail({ version: 3 }));
        },
      ),
    );
    const { result, queryClient } = renderHookWithProviders(() =>
      useReopenTravelRequest(231),
    );
    const expectStored = seedCache(queryClient);

    await result.current.mutateAsync({ expected_version: 2 });

    expect(received).toEqual({ expected_version: 2 });
    expectStored();
  });
});

import { act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@/lib/api/query-keys';
import { buildPage } from '@/test/clients';
import { apiUrl } from '@/test/handlers';
import { renderHookWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildServiceDetail, buildServiceRate } from '@/test/tourist-services';

import {
  useCreateRate,
  useDeleteRate,
  useServiceRates,
  useUpdateRate,
  type ServiceRateCreate,
} from './rate-api';

const rateInput: ServiceRateCreate = {
  name: 'Temporada media',
  valid_from: '2027-01-16',
  valid_until: '2027-06-30',
  currency: 'COP',
  charge_unit: 'per_night',
  amount: '560000',
};

type QueryClient = ReturnType<typeof renderHookWithProviders>['queryClient'];

// Lo que cambia con una tarifa: la tabla, el conteo de vigentes de la ficha y el de la fila
// del servicio en la ficha del proveedor.
function seedAffectedQueries(queryClient: QueryClient) {
  queryClient.setQueryData(
    queryKeys.touristServices.ratesPage(60, 1),
    buildPage([]),
  );
  queryClient.setQueryData(
    queryKeys.touristServices.detail(60),
    buildServiceDetail(),
  );
  queryClient.setQueryData(
    queryKeys.touristServices.list(40, 1),
    buildPage([]),
  );
}

function expectAffectedInvalidated(queryClient: QueryClient) {
  for (const key of [
    queryKeys.touristServices.ratesPage(60, 1),
    queryKeys.touristServices.detail(60),
    queryKeys.touristServices.list(40, 1),
  ]) {
    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
  }
}

describe('tarifas', () => {
  it('useServiceRates pide hasta 100 por página', async () => {
    const page = buildPage([buildServiceRate()]);
    let url: URL | undefined;
    server.use(
      http.get(apiUrl('/api/tourist-services/60/rates'), ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json(page);
      }),
    );

    const { result } = renderHookWithProviders(() => useServiceRates(60, 1));

    await waitFor(() => expect(result.current.data).toEqual(page));
    expect(Object.fromEntries(url!.searchParams)).toEqual({
      page: '1',
      page_size: '100',
    });
  });

  it('agregar una tarifa recarga la tabla y los conteos', async () => {
    let body: unknown;
    server.use(
      http.post(
        apiUrl('/api/tourist-services/60/rates'),
        async ({ request }) => {
          body = await request.json();
          return HttpResponse.json(buildServiceRate(), { status: 201 });
        },
      ),
    );
    const { result, queryClient } = renderHookWithProviders(() =>
      useCreateRate(60),
    );
    seedAffectedQueries(queryClient);

    await act(() => result.current.mutateAsync(rateInput));

    expect(body).toEqual(rateInput);
    expectAffectedInvalidated(queryClient);
  });

  it('editar una tarifa la envía con su versión', async () => {
    let body: unknown;
    server.use(
      http.put(
        apiUrl('/api/tourist-services/60/rates/80'),
        async ({ request }) => {
          body = await request.json();
          return HttpResponse.json(buildServiceRate({ version: 2 }));
        },
      ),
    );
    const { result, queryClient } = renderHookWithProviders(() =>
      useUpdateRate(60),
    );
    seedAffectedQueries(queryClient);

    await act(() =>
      result.current.mutateAsync({
        rateId: 80,
        body: { ...rateInput, expected_version: 1 },
      }),
    );

    expect(body).toEqual({ ...rateInput, expected_version: 1 });
    expectAffectedInvalidated(queryClient);
  });

  it('borrar envía la versión en la URL y acepta la respuesta sin cuerpo', async () => {
    let url: URL | undefined;
    server.use(
      http.delete(
        apiUrl('/api/tourist-services/60/rates/80'),
        ({ request }) => {
          url = new URL(request.url);
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );
    const { result, queryClient } = renderHookWithProviders(() =>
      useDeleteRate(60),
    );
    seedAffectedQueries(queryClient);

    await act(() =>
      result.current.mutateAsync({ rateId: 80, expectedVersion: 4 }),
    );

    expect(url?.searchParams.get('expected_version')).toBe('4');
    expectAffectedInvalidated(queryClient);
  });
});

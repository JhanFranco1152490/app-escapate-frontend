import { act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@/lib/api/query-keys';
import { buildPage } from '@/test/clients';
import { apiUrl } from '@/test/handlers';
import { renderHookWithProviders } from '@/test/render';
import { server } from '@/test/server';
import {
  buildServiceDetail,
  buildServiceListItem,
} from '@/test/tourist-services';

import {
  useChangeTouristServiceStatus,
  useCreateTouristService,
  useSupplierServices,
  useTouristService,
  useUpdateTouristService,
  type TouristServiceCreate,
} from './api';

const serviceInput: TouristServiceCreate = {
  service_type: 'tours',
  name: 'Tour Islas del Rosario',
  destination: 'Cartagena',
  attributes: { duration_value: 8, duration_unit: 'hours', includes: [] },
};

const isInvalidated = (
  queryClient: ReturnType<typeof renderHookWithProviders>['queryClient'],
  key: readonly unknown[],
) => queryClient.getQueryState(key)?.isInvalidated;

describe('consultas', () => {
  it('useSupplierServices pide la página del proveedor', async () => {
    const page = buildPage([buildServiceListItem()]);
    let url: URL | undefined;
    server.use(
      http.get(apiUrl('/api/suppliers/40/tourist-services'), ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json(page);
      }),
    );

    const { result } = renderHookWithProviders(() =>
      useSupplierServices(40, 2),
    );

    await waitFor(() => expect(result.current.data).toEqual(page));
    expect(Object.fromEntries(url!.searchParams)).toEqual({
      page: '2',
      page_size: '20',
    });
  });

  it('useSupplierServices no pide nada si no está habilitada', () => {
    const { result } = renderHookWithProviders(() =>
      useSupplierServices(40, 1, { enabled: false }),
    );

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('useTouristService no pide nada sin id', () => {
    const { result } = renderHookWithProviders(() => useTouristService(null));

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('mutaciones', () => {
  it('crear guarda la ficha e invalida los servicios y la lista de proveedores', async () => {
    const created = buildServiceDetail({ id: 61, service_type: 'tours' });
    let body: unknown;
    server.use(
      http.post(
        apiUrl('/api/suppliers/40/tourist-services'),
        async ({ request }) => {
          body = await request.json();
          return HttpResponse.json(created, { status: 201 });
        },
      ),
    );
    const { result, queryClient } = renderHookWithProviders(() =>
      useCreateTouristService(40),
    );
    queryClient.setQueryData(
      queryKeys.touristServices.list(40, 1),
      buildPage([]),
    );
    queryClient.setQueryData(queryKeys.suppliers.list({}), buildPage([]));

    await act(() => result.current.mutateAsync(serviceInput));

    expect(body).toEqual(serviceInput);
    expect(
      queryClient.getQueryData(queryKeys.touristServices.detail(61)),
    ).toEqual(created);
    expect(
      isInvalidated(queryClient, queryKeys.touristServices.list(40, 1)),
    ).toBe(true);
    expect(isInvalidated(queryClient, queryKeys.suppliers.list({}))).toBe(true);
  });

  it('editar envía la versión y deja la ficha nueva en la caché', async () => {
    const saved = buildServiceDetail({ version: 2 });
    server.use(
      http.put(apiUrl('/api/tourist-services/60'), () =>
        HttpResponse.json(saved),
      ),
    );
    const { result, queryClient } = renderHookWithProviders(() =>
      useUpdateTouristService(60),
    );

    await act(() =>
      result.current.mutateAsync({ ...serviceInput, expected_version: 1 }),
    );

    expect(
      queryClient.getQueryData(queryKeys.touristServices.detail(60)),
    ).toEqual(saved);
  });

  it('desactivar envía la versión que se está mirando', async () => {
    let body: unknown;
    server.use(
      http.post(
        apiUrl('/api/tourist-services/60/deactivate'),
        async ({ request }) => {
          body = await request.json();
          return HttpResponse.json(buildServiceDetail({ is_active: false }));
        },
      ),
    );
    const { result, queryClient } = renderHookWithProviders(() =>
      useChangeTouristServiceStatus(60),
    );
    queryClient.setQueryData(queryKeys.suppliers.list({}), buildPage([]));

    await act(() =>
      result.current.mutateAsync({ action: 'deactivate', expectedVersion: 3 }),
    );

    expect(body).toEqual({ expected_version: 3 });
    expect(isInvalidated(queryClient, queryKeys.suppliers.list({}))).toBe(true);
  });
});

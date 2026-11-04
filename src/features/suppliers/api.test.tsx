import { act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@/lib/api/query-keys';
import { buildPage } from '@/test/clients';
import { apiUrl } from '@/test/handlers';
import { renderHookWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSupplierDetail, buildSupplierListItem } from '@/test/suppliers';

import {
  useChangeSupplierStatus,
  useCreateSupplier,
  useSupplier,
  useSuppliers,
  useUpdateSupplier,
  type SupplierCreate,
} from './api';

const supplierInput: SupplierCreate = {
  trade_name: 'Hotel Costa Azul',
  categories: ['lodging'],
  contact_name: 'Mónica Salas',
  contact_email: 'ventas@example.com',
};

describe('consultas', () => {
  it('useSuppliers envía los filtros y omite los vacíos', async () => {
    const page = buildPage([buildSupplierListItem()]);
    let url: URL | undefined;
    server.use(
      http.get(apiUrl('/api/suppliers'), ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json(page);
      }),
    );

    const { result } = renderHookWithProviders(() =>
      useSuppliers({ q: '', category: 'air', status: 'all', page: 2 }),
    );

    await waitFor(() => expect(result.current.data).toEqual(page));
    expect(Object.fromEntries(url!.searchParams)).toEqual({
      category: 'air',
      status: 'all',
      page: '2',
      page_size: '20',
    });
  });

  it('useSupplier no pide nada sin id', () => {
    const { result } = renderHookWithProviders(() => useSupplier(null));

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('mutaciones', () => {
  it('useCreateSupplier guarda la ficha en la caché e invalida las listas', async () => {
    const created = buildSupplierDetail({ id: 41 });
    server.use(
      http.post(apiUrl('/api/suppliers'), () =>
        HttpResponse.json(created, { status: 201 }),
      ),
    );
    const { result, queryClient } = renderHookWithProviders(() =>
      useCreateSupplier(),
    );
    queryClient.setQueryData(queryKeys.suppliers.list({}), buildPage([]));

    await act(() => result.current.mutateAsync(supplierInput));

    expect(queryClient.getQueryData(queryKeys.suppliers.detail(41))).toEqual(
      created,
    );
    expect(
      queryClient.getQueryState(queryKeys.suppliers.list({}))?.isInvalidated,
    ).toBe(true);
  });

  it('useUpdateSupplier envía el cuerpo con la versión', async () => {
    let body: unknown;
    server.use(
      http.put(apiUrl('/api/suppliers/40'), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(buildSupplierDetail({ version: 2 }));
      }),
    );
    const { result } = renderHookWithProviders(() => useUpdateSupplier(40));

    await act(() =>
      result.current.mutateAsync({ ...supplierInput, expected_version: 1 }),
    );

    expect(body).toMatchObject({
      trade_name: 'Hotel Costa Azul',
      expected_version: 1,
    });
  });

  it.each(['deactivate', 'activate'] as const)(
    'useChangeSupplierStatus %s envía la versión y deja la ficha nueva en la caché',
    async (action) => {
      let body: unknown;
      const changed = buildSupplierDetail({ version: 4 });
      server.use(
        http.post(
          apiUrl(`/api/suppliers/40/${action}`),
          async ({ request }) => {
            body = await request.json();
            return HttpResponse.json(changed);
          },
        ),
      );
      const { result, queryClient } = renderHookWithProviders(() =>
        useChangeSupplierStatus(40),
      );

      await act(() =>
        result.current.mutateAsync({ action, expectedVersion: 3 }),
      );

      expect(body).toEqual({ expected_version: 3 });
      expect(queryClient.getQueryData(queryKeys.suppliers.detail(40))).toEqual(
        changed,
      );
    },
  );
});

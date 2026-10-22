import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@/lib/api/query-keys';
import { apiUrl } from '@/test/handlers';
import { renderHookWithProviders } from '@/test/render';
import { PERMISSION_CATALOG, ROLES, buildRoleDetail } from '@/test/roles';
import { server } from '@/test/server';
import { buildUserPage } from '@/test/users';

import {
  useCreateRole,
  useDeleteRole,
  usePermissionCatalog,
  useRole,
  useRoles,
  useUpdateRole,
} from './api';

const roleInput = {
  name: 'Ventas',
  description: null,
  permissions: ['users.view'],
};

describe('consultas', () => {
  it('useRoles devuelve los roles de /api/roles', async () => {
    server.use(http.get(apiUrl('/api/roles'), () => HttpResponse.json(ROLES)));

    const { result } = renderHookWithProviders(() => useRoles());

    await waitFor(() => expect(result.current.data).toEqual(ROLES));
  });

  it('useRole pide el rol indicado', async () => {
    const role = buildRoleDetail({ id: 3 });
    server.use(http.get(apiUrl('/api/roles/3'), () => HttpResponse.json(role)));

    const { result } = renderHookWithProviders(() => useRole(3));

    await waitFor(() => expect(result.current.data).toEqual(role));
  });

  it('useRole sin id no llama a la API', () => {
    const { result } = renderHookWithProviders(() => useRole(null));

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('usePermissionCatalog devuelve el catálogo de /api/permissions', async () => {
    server.use(
      http.get(apiUrl('/api/permissions'), () =>
        HttpResponse.json(PERMISSION_CATALOG),
      ),
    );

    const { result } = renderHookWithProviders(() => usePermissionCatalog());

    await waitFor(() =>
      expect(result.current.data).toEqual(PERMISSION_CATALOG),
    );
  });
});

describe('mutaciones', () => {
  it('crear guarda el rol en la caché e invalida la lista de roles', async () => {
    const role = buildRoleDetail({ id: 9, name: 'Ventas' });
    let received: unknown;
    server.use(
      http.post(apiUrl('/api/roles'), async ({ request }) => {
        received = await request.json();
        return HttpResponse.json(role, { status: 201 });
      }),
    );
    const { result, queryClient } = renderHookWithProviders(() =>
      useCreateRole(),
    );
    queryClient.setQueryData(queryKeys.roles.lists(), ROLES);

    await result.current.mutateAsync(roleInput);

    expect(received).toEqual(roleInput);
    expect(queryClient.getQueryData(queryKeys.roles.detail(9))).toEqual(role);
    expect(
      queryClient.getQueryState(queryKeys.roles.lists())?.isInvalidated,
    ).toBe(true);
  });

  it('editar invalida la lista de roles y los usuarios, que muestran su nombre', async () => {
    const role = buildRoleDetail({ id: 2, name: 'Ventas' });
    server.use(http.put(apiUrl('/api/roles/2'), () => HttpResponse.json(role)));
    const { result, queryClient } = renderHookWithProviders(() =>
      useUpdateRole(2),
    );
    const usersKey = queryKeys.users.list({ q: '' });
    queryClient.setQueryData(queryKeys.roles.lists(), ROLES);
    queryClient.setQueryData(usersKey, buildUserPage());

    await result.current.mutateAsync(roleInput);

    expect(queryClient.getQueryData(queryKeys.roles.detail(2))).toEqual(role);
    expect(
      queryClient.getQueryState(queryKeys.roles.lists())?.isInvalidated,
    ).toBe(true);
    expect(queryClient.getQueryState(usersKey)?.isInvalidated).toBe(true);
  });

  it('borrar quita el rol de la caché e invalida la lista', async () => {
    server.use(
      http.delete(
        apiUrl('/api/roles/4'),
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const { result, queryClient } = renderHookWithProviders(() =>
      useDeleteRole(4),
    );
    queryClient.setQueryData(queryKeys.roles.detail(4), buildRoleDetail());
    queryClient.setQueryData(queryKeys.roles.lists(), ROLES);

    await result.current.mutateAsync();

    expect(queryClient.getQueryData(queryKeys.roles.detail(4))).toBeUndefined();
    expect(
      queryClient.getQueryState(queryKeys.roles.lists())?.isInvalidated,
    ).toBe(true);
  });
});

import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@/lib/api/query-keys';
import { apiUrl } from '@/test/handlers';
import { renderHookWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';
import { buildUserDetail, buildUserPage } from '@/test/users';

import {
  useCreateUser,
  useDeactivateUser,
  useResendInvitation,
  useUpdateUser,
  useUserLogins,
  useUsers,
} from './api';

const userInput = {
  first_name: 'Laura',
  last_name: 'Rojas',
  email: 'laura.rojas@example.com',
  document_type: 'CC',
  document_number: '1090123456',
  phone: '3001234567',
} as const;

describe('useUsers', () => {
  it('envía los filtros a la API y omite los vacíos', async () => {
    let query: URLSearchParams | undefined;
    server.use(
      http.get(apiUrl('/api/users'), ({ request }) => {
        query = new URL(request.url).searchParams;
        return HttpResponse.json(buildUserPage());
      }),
    );

    const { result } = renderHookWithProviders(() =>
      useUsers({ q: 'laura', status: 'active', roleId: null, page: 2 }),
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Object.fromEntries(query!)).toEqual({
      q: 'laura',
      status: 'active',
      page: '2',
      page_size: '20',
    });
  });
});

describe('useUserLogins', () => {
  it('pide la página indicada de 10 en 10', async () => {
    let query: URLSearchParams | undefined;
    server.use(
      http.get(apiUrl('/api/users/7/logins'), ({ request }) => {
        query = new URL(request.url).searchParams;
        return HttpResponse.json({
          count: 0,
          next: null,
          previous: null,
          results: [],
        });
      }),
    );

    const { result } = renderHookWithProviders(() => useUserLogins(7, 3));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Object.fromEntries(query!)).toEqual({
      page: '3',
      page_size: '10',
    });
  });
});

describe('mutaciones', () => {
  it('crear guarda la ficha en la caché e invalida las listas', async () => {
    const user = buildUserDetail({ id: 7 });
    let received: unknown;
    server.use(
      http.post(apiUrl('/api/users'), async ({ request }) => {
        received = await request.json();
        return HttpResponse.json(
          { user, invitation_sent: true },
          { status: 201 },
        );
      }),
    );
    const { result, queryClient } = renderHookWithProviders(() =>
      useCreateUser(),
    );
    const listKey = queryKeys.users.list({ q: '' });
    queryClient.setQueryData(listKey, buildUserPage());

    await result.current.mutateAsync({ ...userInput, role_id: 2 });

    expect(received).toEqual({ ...userInput, role_id: 2 });
    expect(queryClient.getQueryData(queryKeys.users.detail(7))).toEqual(user);
    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true);
  });

  it('editar al usuario de la sesión invalida también la sesión', async () => {
    const user = buildUserDetail({ id: 1 });
    server.use(
      http.put(apiUrl('/api/users/1'), () =>
        HttpResponse.json({ user, invitation_sent: null }),
      ),
    );
    const { result, queryClient } = renderHookWithProviders(() =>
      useUpdateUser(1),
    );
    queryClient.setQueryData(queryKeys.session(), buildSession({ id: 1 }));

    await result.current.mutateAsync(userInput);

    expect(queryClient.getQueryState(queryKeys.session())?.isInvalidated).toBe(
      true,
    );
  });

  it('editar a otra persona no toca la sesión', async () => {
    const user = buildUserDetail({ id: 7 });
    server.use(
      http.put(apiUrl('/api/users/7'), () =>
        HttpResponse.json({ user, invitation_sent: null }),
      ),
    );
    const { result, queryClient } = renderHookWithProviders(() =>
      useUpdateUser(7),
    );
    queryClient.setQueryData(queryKeys.session(), buildSession({ id: 1 }));

    await result.current.mutateAsync(userInput);

    expect(queryClient.getQueryState(queryKeys.session())?.isInvalidated).toBe(
      false,
    );
  });

  it('desactivar guarda la ficha que devuelve la API', async () => {
    const user = buildUserDetail({ id: 7, is_active: false });
    server.use(
      http.post(apiUrl('/api/users/7/deactivate'), () =>
        HttpResponse.json(user),
      ),
    );
    const { result, queryClient } = renderHookWithProviders(() =>
      useDeactivateUser(7),
    );

    await result.current.mutateAsync();

    expect(queryClient.getQueryData(queryKeys.users.detail(7))).toEqual(user);
  });

  it('reenviar la invitación acepta la respuesta sin cuerpo', async () => {
    server.use(
      http.post(
        apiUrl('/api/users/7/invitation'),
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const { result } = renderHookWithProviders(() => useResendInvitation(7));

    await expect(result.current.mutateAsync()).resolves.toBeUndefined();
  });
});

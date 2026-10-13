import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@/lib/api/query-keys';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderHookWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { useLogin, useLogout, useSession } from './api';

describe('useSession', () => {
  it('devuelve la sesión de /api/auth/me', async () => {
    const session = buildSession();
    server.use(sessionHandler(session));

    const { result } = renderHookWithProviders(() => useSession());

    await waitFor(() => expect(result.current.data).toEqual(session));
  });
});

describe('useLogin', () => {
  it('envía las credenciales y guarda la sesión en la caché', async () => {
    const session = buildSession();
    let received: unknown;
    server.use(
      http.post(apiUrl('/api/auth/login'), async ({ request }) => {
        received = await request.json();
        return HttpResponse.json(session);
      }),
    );
    const { result, queryClient } = renderHookWithProviders(() => useLogin());
    const credentials = {
      document_type: 'CC',
      document_number: '1090123456',
      password: 'una-clave-de-prueba',
    } as const;

    await result.current.mutateAsync(credentials);

    expect(received).toEqual(credentials);
    expect(queryClient.getQueryData(queryKeys.session())).toEqual(session);
  });
});

describe('useLogout', () => {
  it('cierra la sesión y limpia toda la caché', async () => {
    server.use(
      http.post(
        apiUrl('/api/auth/logout'),
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const { result, queryClient } = renderHookWithProviders(() => useLogout());
    queryClient.setQueryData(queryKeys.session(), buildSession());
    queryClient.setQueryData(queryKeys.profile(), { cualquier: 'dato' });

    await result.current.mutateAsync();

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });
});

import { focusManager } from '@tanstack/react-query';
import { act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { queryKeys } from '@/lib/api/query-keys';
import { createQueryClient } from '@/lib/query-client';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderHookWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import {
  useConfirmPasswordReset,
  useLogin,
  useLogout,
  useRequestPasswordReset,
  useResetTokenCheck,
  useSession,
} from './api';

describe('useSession', () => {
  it('devuelve la sesión de /api/auth/me', async () => {
    const session = buildSession();
    server.use(sessionHandler(session));

    const { result } = renderHookWithProviders(() => useSession());

    await waitFor(() => expect(result.current.data).toEqual(session));
  });

  it('vuelve a pedir la sesión al regresar a la pestaña', async () => {
    let requests = 0;
    server.use(
      http.get(apiUrl('/api/auth/me'), () => {
        requests += 1;
        return HttpResponse.json(buildSession());
      }),
    );
    // La caché de la app, que no vuelve a pedir nada al enfocar salvo la sesión.
    const queryClient = createQueryClient();
    const { result } = renderHookWithProviders(() => useSession(), {
      queryClient,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    act(() => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
    });

    await waitFor(() => expect(requests).toBe(2));
    focusManager.setFocused(undefined);
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

describe('useRequestPasswordReset', () => {
  it('envía el documento a /api/auth/password-reset', async () => {
    let received: unknown;
    server.use(
      http.post(apiUrl('/api/auth/password-reset'), async ({ request }) => {
        received = await request.json();
        return HttpResponse.json(
          { detail: 'Solicitud recibida.' },
          { status: 202 },
        );
      }),
    );
    const { result } = renderHookWithProviders(() => useRequestPasswordReset());
    const document = {
      document_type: 'CC',
      document_number: '1090123456',
    } as const;

    await result.current.mutateAsync(document);

    expect(received).toEqual(document);
  });
});

describe('useResetTokenCheck', () => {
  it('comprueba el token en el cuerpo, no en la URL', async () => {
    let received: unknown;
    let url = '';
    server.use(
      http.post(
        apiUrl('/api/auth/password-reset/check'),
        async ({ request }) => {
          received = await request.json();
          url = request.url;
          return HttpResponse.json({
            purpose: 'invitation',
            full_name: 'Persona de Prueba',
          });
        },
      ),
    );

    const { result } = renderHookWithProviders(() =>
      useResetTokenCheck('abc.def'),
    );

    await waitFor(() =>
      expect(result.current.data).toEqual({
        purpose: 'invitation',
        full_name: 'Persona de Prueba',
      }),
    );
    expect(received).toEqual({ token: 'abc.def' });
    expect(url).not.toContain('abc.def');
  });

  it('sin token no llama a la API', () => {
    const { result } = renderHookWithProviders(() => useResetTokenCheck(null));

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useConfirmPasswordReset', () => {
  it('crea la contraseña y guarda la sesión en la caché', async () => {
    const session = buildSession();
    let received: unknown;
    server.use(
      http.post(
        apiUrl('/api/auth/password-reset/confirm'),
        async ({ request }) => {
          received = await request.json();
          return HttpResponse.json(session);
        },
      ),
    );
    const { result, queryClient } = renderHookWithProviders(() =>
      useConfirmPasswordReset(),
    );
    const body = {
      token: 'abc.def',
      password: 'una frase larga de prueba',
      password_confirmation: 'una frase larga de prueba',
    };

    await result.current.mutateAsync(body);

    expect(received).toEqual(body);
    expect(queryClient.getQueryData(queryKeys.session())).toEqual(session);
  });
});

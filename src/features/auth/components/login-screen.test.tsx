import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { UrlUpdateEvent } from 'nuqs/adapters/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiFetch } from '@/lib/api/client';
import { RATE_LIMIT_MESSAGE } from '@/lib/api/errors';
import { queryKeys } from '@/lib/api/query-keys';
import { apiUrl, noSessionHandlers, sessionHandler } from '@/test/handlers';
import { createTestQueryClient, renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { googleLoginUrl } from '../google-login-url';
import { clearResetPrefill, readResetPrefill } from '../reset-prefill';
import { LoginScreen } from './login-screen';

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

beforeEach(() => {
  clearResetPrefill();
  router.replace.mockReset();
  server.use(...noSessionHandlers);
});

const respondToLogin = (respond: () => Response) =>
  server.use(http.post(apiUrl('/api/auth/login'), respond));

async function login() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/Número de documento/), '1090123456');
  await user.type(screen.getByLabelText(/^Contraseña/), 'una-clave-de-prueba');
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
}

describe('LoginScreen', () => {
  it('muestra el título y el botón de Google con el next de la URL', () => {
    renderWithProviders(<LoginScreen />, {
      searchParams: '?next=/clientes',
    });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Iniciar sesión' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Continuar con Google' }),
    ).toHaveAttribute('href', googleLoginUrl('/clientes'));
  });

  it('muestra el aviso del error de la URL y lo quita de la URL', async () => {
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
    renderWithProviders(<LoginScreen />, {
      searchParams: '?error=google_cancelled&next=/clientes',
      onUrlUpdate,
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Cancelaste el inicio de sesión con Google.',
    );
    await vi.waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
    const { searchParams } = onUrlUpdate.mock.lastCall![0];
    expect(searchParams.has('error')).toBe(false);
    expect(searchParams.get('next')).toBe('/clientes');
    // El aviso sigue a la vista aunque el parámetro ya no esté.
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('no muestra nada con un error desconocido', () => {
    renderWithProviders(<LoginScreen />, {
      searchParams: '?error=<b>texto</b>',
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('con credenciales no válidas muestra el aviso de la API', async () => {
    respondToLogin(() =>
      HttpResponse.json(
        { detail: 'Mensaje del API', code: 'invalid_credentials', fields: {} },
        { status: 401 },
      ),
    );
    renderWithProviders(<LoginScreen />);

    await login();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El documento o la contraseña no son válidos.',
    );
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('con la cuenta bloqueada ofrece restablecer o entrar con Google', async () => {
    respondToLogin(() =>
      HttpResponse.json(
        { detail: 'Mensaje del API', code: 'account_locked', fields: {} },
        { status: 429 },
      ),
    );
    renderWithProviders(<LoginScreen />, {
      searchParams: '?next=/clientes',
    });

    await login();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Demasiados intentos fallidos. Puedes esperar 15 minutos, restablecer tu contraseña o entrar con Google.',
    );
    expect(
      within(alert).getByRole('link', { name: 'entrar con Google' }),
    ).toHaveAttribute('href', googleLoginUrl('/clientes'));
    const reset = within(alert).getByRole('link', {
      name: 'restablecer tu contraseña',
    });
    expect(reset).toHaveAttribute('href', '/recuperar-contrasena');

    await userEvent.click(reset);

    expect(readResetPrefill()).toEqual({
      document_type: 'CC',
      document_number: '1090123456',
    });
  });

  it.each([
    ['la cuenta inactiva', 403, 'account_inactive', 'Tu cuenta está inactiva.'],
    ['el límite de solicitudes', 429, 'throttled', RATE_LIMIT_MESSAGE],
  ])('con %s muestra su aviso', async (_, status, code, expected) => {
    respondToLogin(() =>
      HttpResponse.json(
        { detail: 'Mensaje del API', code, fields: {} },
        { status },
      ),
    );
    renderWithProviders(<LoginScreen />);

    await login();

    expect(await screen.findByRole('alert')).toHaveTextContent(expected);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('sin respuesta de la API muestra el aviso genérico', async () => {
    respondToLogin(() => HttpResponse.error());
    renderWithProviders(<LoginScreen />);

    await login();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos iniciar sesión. Inténtalo de nuevo.',
    );
  });

  it.each([
    ['un next interno', '?next=/clientes', '/clientes'],
    ['un next externo', '?next=//evil.example', '/'],
    ['un next absoluto', '?next=https://evil.example', '/'],
    ['un next con barra invertida', '?next=/\\evil.example', '/'],
    ['sin next', '', '/'],
  ])('al entrar con %s navega a %s', async (_, searchParams, expected) => {
    respondToLogin(() => HttpResponse.json(buildSession()));
    renderWithProviders(<LoginScreen />, { searchParams });

    await login();

    await vi.waitFor(() => expect(router.replace).toHaveBeenCalled());
    expect(router.replace).toHaveBeenCalledOnce();
    expect(router.replace).toHaveBeenCalledWith(expected);
  });

  it('con una sesión activa redirige a la página principal sin mostrar el formulario', async () => {
    server.use(sessionHandler());
    renderWithProviders(<LoginScreen />);

    await vi.waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
    expect(
      screen.queryByRole('button', { name: 'Entrar' }),
    ).not.toBeInTheDocument();
  });

  it('con una sesión activa va a la página principal aunque haya next', async () => {
    server.use(sessionHandler());
    renderWithProviders(<LoginScreen />, { searchParams: '?next=/clientes' });

    await vi.waitFor(() => expect(router.replace).toHaveBeenCalled());
    expect(router.replace).toHaveBeenCalledOnce();
    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('con una sesión vencida que quedó en caché no redirige', async () => {
    // Así llega quien estaba en el panel cuando la sesión venció: la caché conserva el
    // último usuario, pero la consulta terminó en 401.
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKeys.session(), buildSession());
    await queryClient
      .fetchQuery({
        queryKey: queryKeys.session(),
        queryFn: () => apiFetch('/api/auth/me'),
      })
      .catch(() => undefined);
    expect(queryClient.getQueryState(queryKeys.session())?.status).toBe(
      'error',
    );
    renderWithProviders(<LoginScreen />, { queryClient });

    expect(
      await screen.findByRole('button', { name: 'Entrar' }),
    ).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(router.replace).not.toHaveBeenCalled();
  });
});

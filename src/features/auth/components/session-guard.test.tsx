import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiUrl, noSessionHandlers, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { SessionGuard } from './session-guard';

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

beforeEach(() => {
  router.replace.mockReset();
  window.history.replaceState(null, '', '/');
});

const renderGuard = () =>
  renderWithProviders(
    <SessionGuard>
      <p>Contenido del panel</p>
    </SessionGuard>,
  );

describe('SessionGuard', () => {
  it('mientras carga muestra el esqueleto y no el contenido', () => {
    server.use(sessionHandler());
    renderGuard();

    expect(
      screen.getByRole('status', { name: 'Cargando el panel' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Contenido del panel')).not.toBeInTheDocument();
  });

  it('con sesión muestra el contenido', async () => {
    server.use(sessionHandler());
    renderGuard();

    expect(await screen.findByText('Contenido del panel')).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('sin sesión redirige al login con la ruta actual en next', async () => {
    window.history.replaceState(null, '', '/clientes?pagina=2');
    server.use(...noSessionHandlers);
    renderGuard();

    await vi.waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        '/iniciar-sesion?next=%2Fclientes%3Fpagina%3D2',
      ),
    );
    expect(screen.queryByText('Contenido del panel')).not.toBeInTheDocument();
  });

  it('sin sesión en la página principal redirige al login sin next', async () => {
    server.use(...noSessionHandlers);
    renderGuard();

    await vi.waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/iniciar-sesion'),
    );
  });

  it.each([
    [
      'un error del servidor',
      () =>
        HttpResponse.json(
          { detail: 'Error', code: 'internal_error', fields: {} },
          { status: 500 },
        ),
    ],
    ['un fallo de red', () => HttpResponse.error()],
  ])(
    'ante %s no saca a la persona y permite reintentar',
    async (_, respondWithFailure) => {
      let failing = true;
      server.use(
        http.get(apiUrl('/api/auth/me'), () =>
          failing ? respondWithFailure() : HttpResponse.json(buildSession()),
        ),
      );
      renderGuard();

      const retry = await screen.findByRole('button', { name: 'Reintentar' });
      expect(router.replace).not.toHaveBeenCalled();

      failing = false;
      await userEvent.setup().click(retry);

      expect(
        await screen.findByText('Contenido del panel'),
      ).toBeInTheDocument();
    },
  );
});

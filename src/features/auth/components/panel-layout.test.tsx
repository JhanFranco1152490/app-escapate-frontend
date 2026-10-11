import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/lib/api/query-keys';
import { apiUrl } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { PanelLayout } from './panel-layout';
import { SessionGuard } from './session-guard';

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

let sessionRequests = 0;

beforeEach(() => {
  router.replace.mockReset();
  sessionRequests = 0;
  let loggedIn = true;
  server.use(
    http.get(apiUrl('/api/auth/me'), () => {
      sessionRequests += 1;
      return loggedIn
        ? HttpResponse.json(
            buildSession({
              full_name: 'Persona de Prueba',
              role: { id: 2, name: 'Asesor comercial' },
            }),
          )
        : HttpResponse.json(
            {
              detail: 'No autenticado.',
              code: 'not_authenticated',
              fields: {},
            },
            { status: 401 },
          );
    }),
    http.post(apiUrl('/api/auth/refresh'), () =>
      HttpResponse.json(
        { detail: 'No autenticado.', code: 'not_authenticated', fields: {} },
        { status: 401 },
      ),
    ),
    http.post(apiUrl('/api/auth/logout'), () => {
      loggedIn = false;
      return new HttpResponse(null, { status: 204 });
    }),
  );
});

// Igual que el layout del grupo de rutas del panel.
const renderPanel = () =>
  renderWithProviders(
    <SessionGuard>
      <PanelLayout>
        <p>Contenido del panel</p>
      </PanelLayout>
    </SessionGuard>,
  );

describe('PanelLayout', () => {
  it('muestra el nombre, el rol y el contenido', async () => {
    renderPanel();

    expect(await screen.findByText('Contenido del panel')).toBeInTheDocument();
    expect(screen.getByText('Persona de Prueba')).toBeInTheDocument();
    expect(screen.getByText('Asesor comercial')).toBeInTheDocument();
  });

  it('cerrar sesión limpia la caché y redirige una sola vez al login', async () => {
    const { queryClient } = renderPanel();
    await screen.findByText('Contenido del panel');
    queryClient.setQueryData(queryKeys.profile(), { dato: 'de la sesión' });

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    await vi.waitFor(() => expect(router.replace).toHaveBeenCalled());
    expect(router.replace).toHaveBeenCalledOnce();
    expect(router.replace).toHaveBeenCalledWith('/iniciar-sesion');
    // La guardia no vuelve a pedir la sesión tras el cierre: ese 401 la haría redirigir
    // otra vez, con next.
    expect(sessionRequests).toBe(1);
    const cachedData = queryClient
      .getQueryCache()
      .getAll()
      .map((query) => query.state.data);
    expect(cachedData.every((data) => data === undefined)).toBe(true);
  });

  it('en celular, cierra sesión desde el menú de la cuenta', async () => {
    renderPanel();
    await screen.findByText('Contenido del panel');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Menú de la cuenta' }));
    await user.click(
      await screen.findByRole('menuitem', { name: 'Cerrar sesión' }),
    );

    await vi.waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/iniciar-sesion'),
    );
  });
});

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { PERMISSION_CATALOG, buildRoleDetail } from '@/test/roles';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { readRoleNotice } from '../role-notice';
import { CreateRoleScreen } from './create-role-screen';

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

let requests = 0;
let received: unknown;

beforeEach(() => {
  router.push.mockReset();
  requests = 0;
  received = undefined;
  server.use(
    sessionHandler(
      buildSession({ permissions: ['roles.view', 'roles.manage'] }),
    ),
    http.get(apiUrl('/api/permissions'), () =>
      HttpResponse.json(PERMISSION_CATALOG),
    ),
    http.post(apiUrl('/api/roles'), async ({ request }) => {
      requests += 1;
      received = await request.json();
      return HttpResponse.json(buildRoleDetail({ id: 9, name: 'Ventas' }), {
        status: 201,
      });
    }),
  );
});

const renderScreen = () =>
  renderWithProviders(
    <SessionGuard>
      <CreateRoleScreen />
    </SessionGuard>,
  );

const checkbox = (name: string) => screen.getByRole('checkbox', { name });

describe('CreateRoleScreen', () => {
  it('arma la matriz desde el catálogo, con los avisos de los permisos delicados', async () => {
    renderScreen();

    const users = await screen.findByRole('group', { name: 'Usuarios' });
    expect(
      within(users)
        .getAllByRole('checkbox')
        .map((box) => box.getAttribute('aria-label')),
    ).toEqual(['Usuarios: ver', 'Usuarios: gestionar']);
    expect(checkbox('Usuarios: gestionar')).toHaveAccessibleDescription(
      PERMISSION_CATALOG[1].help!,
    );
    expect(checkbox('Roles y permisos: gestionar')).toHaveAccessibleDescription(
      PERMISSION_CATALOG[3].help!,
    );
    expect(checkbox('Usuarios: ver')).not.toBeChecked();
  });

  it('marcar "Gestionar" marca "Ver", y desmarcar "Ver" desmarca "Gestionar"', async () => {
    const user = userEvent.setup();
    renderScreen();
    await screen.findByRole('group', { name: 'Usuarios' });

    await user.click(checkbox('Usuarios: gestionar'));
    expect(checkbox('Usuarios: ver')).toBeChecked();

    await user.click(checkbox('Usuarios: ver'));
    expect(checkbox('Usuarios: gestionar')).not.toBeChecked();
  });

  it('sin nombre no llama a la API', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(await screen.findByRole('button', { name: 'Crear rol' }));

    expect(
      await screen.findByText('Este campo es obligatorio.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre/)).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(requests).toBe(0);
  });

  it('crea el rol y abre su página con el aviso', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.type(await screen.findByLabelText(/Nombre/), ' Ventas ');
    await user.click(checkbox('Usuarios: gestionar'));
    await user.click(screen.getByRole('button', { name: 'Crear rol' }));

    await vi.waitFor(() =>
      expect(router.push).toHaveBeenCalledWith('/roles/9'),
    );
    expect(received).toEqual({
      name: 'Ventas',
      description: null,
      permissions: ['users.view', 'users.manage'],
    });
    expect(readRoleNotice(9)).toBe('Rol creado.');
  });

  it('muestra el error del nombre en su campo y el de los permisos arriba de la matriz', async () => {
    server.use(
      http.post(apiUrl('/api/roles'), () =>
        HttpResponse.json(
          {
            detail: 'Revisa los campos.',
            code: 'validation_error',
            fields: {
              name: ['Ya existe un rol con ese nombre.'],
              permissions: [
                'El rol Asesor comercial ya tiene exactamente estos permisos.',
              ],
            },
          },
          { status: 422 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderScreen();

    await user.type(await screen.findByLabelText(/Nombre/), 'Asesor');
    await user.click(screen.getByRole('button', { name: 'Crear rol' }));

    expect(
      await screen.findByText('Ya existe un rol con ese nombre.'),
    ).toBeInTheDocument();
    const matrix = screen.getByRole('region', { name: 'Permisos' });
    expect(
      within(matrix).getByText(
        'El rol Asesor comercial ya tiene exactamente estos permisos.',
      ),
    ).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('si el catálogo no carga, ofrece reintentar', async () => {
    server.use(
      http.get(apiUrl('/api/permissions'), () =>
        HttpResponse.json(
          { detail: 'Error.', code: 'server_error', fields: {} },
          { status: 500 },
        ),
      ),
    );
    renderScreen();

    expect(
      await screen.findByRole('button', { name: 'Reintentar' }),
    ).toBeInTheDocument();
  });
});

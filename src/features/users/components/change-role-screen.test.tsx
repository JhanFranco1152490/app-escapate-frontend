import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { PERMISSION_CATALOG, ROLES, buildRoleDetail } from '@/test/roles';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';
import { buildUserDetail } from '@/test/users';

import { readSavedNotice } from '../saved-notice';
import { ChangeRoleScreen } from './change-role-screen';

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

// Lo que autoriza cada rol sembrado, para "Qué podrá hacer".
const ROLE_PERMISSIONS: Record<number, string[]> = {
  1: PERMISSION_CATALOG.map((item) => item.code),
  2: ['users.view'],
  3: [],
  4: [],
};

let changes: unknown[] = [];

beforeEach(() => {
  router.push.mockReset();
  router.replace.mockReset();
  changes = [];
  server.use(
    http.get(apiUrl('/api/users/7'), () =>
      HttpResponse.json(buildUserDetail({ id: 7 })),
    ),
    http.get(apiUrl('/api/roles'), () => HttpResponse.json(ROLES)),
    http.get(apiUrl('/api/permissions'), () =>
      HttpResponse.json(PERMISSION_CATALOG),
    ),
    http.get(apiUrl('/api/roles/:id'), ({ params }) => {
      const id = Number(params.id);
      return HttpResponse.json(
        buildRoleDetail({
          ...ROLES[id - 1],
          permissions: ROLE_PERMISSIONS[id],
        }),
      );
    }),
    http.put(apiUrl('/api/users/7/role'), async ({ request }) => {
      const body = (await request.json()) as { role_id: number };
      changes.push(body);
      const role = ROLES[body.role_id - 1];
      return HttpResponse.json(
        buildUserDetail({ id: 7, role: { id: role.id, name: role.name } }),
      );
    }),
  );
});

// Quien cambia roles puede no ver la pantalla de roles: basta con gestionar usuarios.
const renderScreen = (id = '7') => {
  server.use(
    sessionHandler(
      buildSession({ permissions: ['users.view', 'users.manage'] }),
    ),
  );
  return renderWithProviders(
    <SessionGuard>
      <ChangeRoleScreen id={id} />
    </SessionGuard>,
  );
};

const option = (name: RegExp) => screen.getByRole('radio', { name });
const save = () => screen.getByRole('button', { name: 'Guardar rol' });

describe('ChangeRoleScreen', () => {
  it('muestra a la persona y los roles con su descripción, marcando el actual', async () => {
    renderScreen();

    expect(
      await screen.findByRole('heading', { name: 'Laura Rojas' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('radio', { name: /Asesor comercial/ }),
    ).toBeChecked();
    expect(screen.getByText('Actual')).toBeInTheDocument();
    expect(
      screen.getByText('Proveedores, servicios y tarifas.'),
    ).toBeInTheDocument();
    expect(save()).toBeDisabled();
  });

  it('"Qué podrá hacer" cambia al elegir otro rol', async () => {
    const user = userEvent.setup();
    renderScreen();
    const grants = await screen.findByRole('region', {
      name: 'Qué podrá hacer',
    });
    expect(
      await within(grants).findByText('Usuarios: ver'),
    ).toBeInTheDocument();

    await user.click(option(/Operativo/));

    expect(
      await within(grants).findByText('Solo verá la página principal.'),
    ).toBeInTheDocument();
  });

  it('con otro rol guarda sin confirmar y vuelve a la ficha con el aviso', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(await screen.findByRole('radio', { name: /Operativo/ }));
    await user.click(save());

    await vi.waitFor(() =>
      expect(router.push).toHaveBeenCalledWith('/usuarios/7'),
    );
    expect(changes).toEqual([{ role_id: 4 }]);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(readSavedNotice(7)).toMatchObject({ kind: 'role' });
  });

  it('hacer Administrador pide confirmación; cancelar no cambia nada', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(
      await screen.findByRole('radio', { name: /Administrador/ }),
    );
    await user.click(save());
    const dialog = screen.getByRole('alertdialog');
    expect(
      within(dialog).getByRole('heading', {
        name: '¿Hacer Administrador a Laura Rojas?',
      }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'Tendrá acceso a todo el panel, incluida la gestión de usuarios y de roles.',
      ),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    expect(changes).toEqual([]);
  });

  it('hacer Administrador, al confirmar, guarda', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(
      await screen.findByRole('radio', { name: /Administrador/ }),
    );
    await user.click(save());
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Hacer Administrador',
      }),
    );

    await vi.waitFor(() => expect(changes).toEqual([{ role_id: 1 }]));
  });

  it('si la API no lo permite, muestra su motivo', async () => {
    server.use(
      http.put(apiUrl('/api/users/7/role'), () =>
        HttpResponse.json(
          {
            detail:
              'Debe quedar al menos una persona activa que pueda gestionar usuarios.',
            code: 'last_user_manager',
            fields: {},
          },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderScreen();

    await user.click(await screen.findByRole('radio', { name: /Operativo/ }));
    await user.click(save());

    expect(
      await screen.findByText(
        'Debe quedar al menos una persona activa que pueda gestionar usuarios.',
      ),
    ).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('la propia cuenta, por URL, vuelve a la ficha', async () => {
    server.use(
      http.get(apiUrl('/api/users/1'), () =>
        HttpResponse.json(buildUserDetail({ id: 1 })),
      ),
    );
    renderScreen('1');

    await vi.waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/usuarios/1'),
    );
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });
});

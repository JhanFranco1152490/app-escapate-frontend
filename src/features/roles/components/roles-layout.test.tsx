import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { ROLES } from '@/test/roles';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { setRoleNotice } from '../role-notice';
import { RolesIndex } from './roles-index';
import { RolesLayout } from './roles-layout';

const navigation = vi.hoisted(() => ({ pathname: '/roles' }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => navigation.pathname,
}));

beforeEach(() => {
  navigation.pathname = '/roles';
  server.use(http.get(apiUrl('/api/roles'), () => HttpResponse.json(ROLES)));
});

const renderLayout = (
  permissions = ['roles.view', 'roles.manage', 'users.view'],
) => {
  server.use(sessionHandler(buildSession({ permissions })));
  return renderWithProviders(
    <SessionGuard>
      <RolesLayout>
        <RolesIndex />
      </RolesLayout>
    </SessionGuard>,
  );
};

const roleList = () => screen.findByRole('list', { name: 'Roles' });

describe('RolesLayout', () => {
  it('lista los roles con su descripción, conteo y la marca "Protegido"', async () => {
    renderLayout();

    const list = await roleList();
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(4);

    const admin = items[0];
    expect(
      within(admin).getByRole('link', { name: /Administrador/ }),
    ).toHaveAttribute('href', '/roles/1');
    expect(within(admin).getByText('Protegido')).toBeInTheDocument();
    expect(
      within(admin).getByText(
        'Acceso a todo el panel, incluida la gestión de usuarios y permisos.',
      ),
    ).toBeInTheDocument();

    expect(
      within(items[1]).getByText('5 usuarios · 1 inactivo'),
    ).toBeInTheDocument();
    expect(within(items[1]).queryByText('Protegido')).not.toBeInTheDocument();
    expect(within(items[3]).getByText('Sin usuarios')).toBeInTheDocument();
  });

  it('marca el rol abierto', async () => {
    navigation.pathname = '/roles/3';
    renderLayout();

    const list = await roleList();
    expect(
      within(list).getByRole('link', { name: /Encargado de proveedores/ }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      within(list).getByRole('link', { name: /Operativo/ }),
    ).not.toHaveAttribute('aria-current');
  });

  it('sin un rol elegido, invita a elegir uno', async () => {
    renderLayout();

    expect(
      await screen.findByText('Elige un rol para ver sus permisos.'),
    ).toBeInTheDocument();
  });

  it('al volver de borrar un rol, muestra el aviso', async () => {
    setRoleNotice({ target: 'list', text: 'Rol borrado.' });
    renderLayout();

    expect(await screen.findByText('Rol borrado.')).toBeInTheDocument();
  });

  it('"Nuevo rol" solo con roles.manage', async () => {
    const { unmount } = renderLayout();
    expect(
      await screen.findByRole('link', { name: 'Nuevo rol' }),
    ).toHaveAttribute('href', '/roles/nuevo');
    unmount();

    renderLayout(['roles.view']);
    await roleList();
    expect(
      screen.queryByRole('link', { name: 'Nuevo rol' }),
    ).not.toBeInTheDocument();
  });

  it('si la lista no carga, ofrece reintentar', async () => {
    let fail = true;
    server.use(
      http.get(apiUrl('/api/roles'), () =>
        fail
          ? HttpResponse.json(
              { detail: 'Error.', code: 'server_error', fields: {} },
              { status: 500 },
            )
          : HttpResponse.json(ROLES),
      ),
    );
    renderLayout();

    const retry = await screen.findByRole('button', { name: 'Reintentar' });
    fail = false;
    await userEvent.click(retry);

    expect(await roleList()).toBeInTheDocument();
  });
});

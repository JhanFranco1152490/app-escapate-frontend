import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { ROLES } from '@/test/roles';
import { buildSession } from '@/test/session';
import {
  buildUserDetail,
  buildUserListItem,
  buildUserPage,
} from '@/test/users';

import type { UserListItem } from '../api';
import { UsersScreen } from './users-screen';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

let mutations: string[] = [];

const serveList = (...users: UserListItem[]) =>
  server.use(
    http.get(apiUrl('/api/users'), () =>
      HttpResponse.json(buildUserPage(users)),
    ),
  );

const conflict = (code: string, detail: string) =>
  HttpResponse.json({ detail, code, fields: {} }, { status: 409 });

beforeEach(() => {
  mutations = [];
  server.use(http.get(apiUrl('/api/roles'), () => HttpResponse.json(ROLES)));
  serveList(buildUserListItem({ id: 7 }));
});

const renderScreen = async ({
  permissions = ['users.view', 'users.manage'],
  sessionId = 1,
  name = 'Laura Rojas',
} = {}) => {
  server.use(sessionHandler(buildSession({ id: sessionId, permissions })));
  renderWithProviders(
    <SessionGuard>
      <UsersScreen />
    </SessionGuard>,
  );
  await screen.findByRole('button', { name: `Acciones de ${name}` });
  return userEvent.setup();
};

const openMenu = async (
  user: ReturnType<typeof userEvent.setup>,
  name = 'Laura Rojas',
) => {
  await user.click(screen.getByRole('button', { name: `Acciones de ${name}` }));
  return screen.findByRole('menu');
};

const itemNames = (menu: HTMLElement) =>
  within(menu)
    .getAllByRole('menuitem')
    .map((item) => item.textContent);

describe('menú de acciones de la fila', () => {
  it('una cuenta activa ofrece ver, editar y desactivar', async () => {
    const user = await renderScreen();

    const menu = await openMenu(user);

    expect(itemNames(menu)).toEqual(['Ver ficha', 'Editar', 'Desactivar']);
    expect(
      within(menu).getByRole('menuitem', { name: 'Ver ficha' }),
    ).toHaveAttribute('href', '/usuarios/7');
    expect(
      within(menu).getByRole('menuitem', { name: 'Editar' }),
    ).toHaveAttribute('href', '/usuarios/7/editar');
  });

  it('una invitación pendiente ofrece reenviarla', async () => {
    serveList(buildUserListItem({ id: 7, invitation_pending: true }));
    const user = await renderScreen();

    const menu = await openMenu(user);

    expect(itemNames(menu)).toEqual([
      'Ver ficha',
      'Editar',
      'Reenviar invitación',
      'Desactivar',
    ]);
  });

  it('una cuenta inactiva ofrece activar y no desactivar ni reenviar', async () => {
    serveList(
      buildUserListItem({ id: 7, is_active: false, invitation_pending: true }),
    );
    const user = await renderScreen();

    const menu = await openMenu(user);

    expect(itemNames(menu)).toEqual(['Ver ficha', 'Editar', 'Activar']);
  });

  it('en la propia fila no se ofrece desactivar', async () => {
    const user = await renderScreen({ sessionId: 7 });

    const menu = await openMenu(user);

    expect(itemNames(menu)).toEqual(['Ver ficha', 'Editar']);
  });

  it('sin users.manage solo se ofrece ver la ficha', async () => {
    serveList(buildUserListItem({ id: 7, invitation_pending: true }));
    const user = await renderScreen({ permissions: ['users.view'] });

    const menu = await openMenu(user);

    expect(itemNames(menu)).toEqual(['Ver ficha']);
  });

  it('desactivar pide confirmación, llama a la API y dice de quién habla', async () => {
    server.use(
      http.post(apiUrl('/api/users/7/deactivate'), () => {
        mutations.push('deactivate');
        return HttpResponse.json(buildUserDetail({ id: 7, is_active: false }));
      }),
    );
    const user = await renderScreen();

    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Desactivar' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('¿Desactivar a Laura Rojas?');
    expect(mutations).toEqual([]);
    await user.click(
      within(dialog).getByRole('button', { name: 'Desactivar' }),
    );

    expect(
      await screen.findByText(
        'Laura Rojas: Cuenta desactivada. Se cerraron sus sesiones abiertas.',
      ),
    ).toBeInTheDocument();
    expect(mutations).toEqual(['deactivate']);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('cancelar la confirmación no llama a la API', async () => {
    server.use(
      http.post(apiUrl('/api/users/7/deactivate'), () => {
        mutations.push('deactivate');
        return HttpResponse.json(buildUserDetail({ id: 7 }));
      }),
    );
    const user = await renderScreen();

    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Desactivar' }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(mutations).toEqual([]);
  });

  it('un 409 al desactivar queda dentro del diálogo, que sigue abierto', async () => {
    server.use(
      http.post(apiUrl('/api/users/7/deactivate'), () =>
        conflict(
          'last_user_manager',
          'Debe quedar al menos una persona activa que pueda gestionar usuarios.',
        ),
      ),
    );
    const user = await renderScreen();

    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Desactivar' }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(
      within(dialog).getByRole('button', { name: 'Desactivar' }),
    );

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Debe quedar al menos una persona activa',
    );
  });

  it('el error de un intento anterior no aparece al abrir el diálogo de nuevo', async () => {
    server.use(
      http.post(apiUrl('/api/users/7/deactivate'), () =>
        conflict('last_user_manager', 'Debe quedar alguien.'),
      ),
    );
    const user = await renderScreen();
    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Desactivar' }));
    let dialog = await screen.findByRole('alertdialog');
    await user.click(
      within(dialog).getByRole('button', { name: 'Desactivar' }),
    );
    await within(dialog).findByRole('alert');
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Desactivar' }));
    dialog = await screen.findByRole('alertdialog');

    expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('activar llama a la API y avisa de quién se trata', async () => {
    serveList(buildUserListItem({ id: 7, is_active: false }));
    server.use(
      http.post(apiUrl('/api/users/7/activate'), () => {
        mutations.push('activate');
        return HttpResponse.json(buildUserDetail({ id: 7 }));
      }),
    );
    const user = await renderScreen();

    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Activar' }));

    expect(
      await screen.findByText(
        'Laura Rojas: Cuenta activada. Ya puede entrar al panel.',
      ),
    ).toBeInTheDocument();
    expect(mutations).toEqual(['activate']);
  });

  it('reenviar la invitación avisa del envío o del error del correo', async () => {
    serveList(buildUserListItem({ id: 7, invitation_pending: true }));
    let fail = true;
    server.use(
      http.post(apiUrl('/api/users/7/invitation'), () =>
        fail
          ? HttpResponse.json(
              {
                detail: 'No pudimos enviar el correo. Inténtalo de nuevo.',
                code: 'email_delivery_failed',
                fields: {},
              },
              { status: 502 },
            )
          : new HttpResponse(null, { status: 204 }),
      ),
    );
    const user = await renderScreen();

    await openMenu(user);
    await user.click(
      screen.getByRole('menuitem', { name: 'Reenviar invitación' }),
    );
    expect(
      await screen.findByText(
        'Laura Rojas: No pudimos enviar el correo. Inténtalo de nuevo.',
      ),
    ).toBeInTheDocument();

    fail = false;
    await openMenu(user);
    await user.click(
      screen.getByRole('menuitem', { name: 'Reenviar invitación' }),
    );
    expect(
      await screen.findByText('Laura Rojas: Invitación enviada.'),
    ).toBeInTheDocument();
  });

  it('cada fila tiene su propio menú', async () => {
    serveList(
      buildUserListItem({ id: 7 }),
      buildUserListItem({ id: 8, full_name: 'Ana Pérez', is_active: false }),
    );
    const user = await renderScreen();

    const menu = await openMenu(user, 'Ana Pérez');

    expect(itemNames(menu)).toEqual(['Ver ficha', 'Editar', 'Activar']);
  });
});

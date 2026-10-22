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

import type { RoleDetail } from '../api';
import { readRoleNotice, setRoleNotice } from '../role-notice';
import { RoleScreen } from './role-screen';

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

let roleRequests = 0;
let saved: unknown;

const serveRole = (role: RoleDetail) =>
  server.use(
    http.get(apiUrl(`/api/roles/${role.id}`), () => {
      roleRequests += 1;
      return HttpResponse.json(role);
    }),
  );

const conflict = (code: string, detail: string) =>
  HttpResponse.json({ detail, code, fields: {} }, { status: 409 });

beforeEach(() => {
  router.push.mockReset();
  roleRequests = 0;
  saved = undefined;
  serveRole(buildRoleDetail({ id: 2, permissions: ['users.view'] }));
  server.use(
    http.get(apiUrl('/api/permissions'), () =>
      HttpResponse.json(PERMISSION_CATALOG),
    ),
    http.put(apiUrl('/api/roles/2'), async ({ request }) => {
      saved = await request.json();
      return HttpResponse.json(
        buildRoleDetail({ id: 2, ...(saved as object) }),
      );
    }),
  );
});

const renderScreen = ({
  id = '2',
  permissions = ['roles.view', 'roles.manage'],
} = {}) => {
  server.use(sessionHandler(buildSession({ permissions })));
  return renderWithProviders(
    <SessionGuard>
      <RoleScreen id={id} />
    </SessionGuard>,
  );
};

const checkbox = (name: string) => screen.getByRole('checkbox', { name });
const nameInput = () => screen.findByLabelText(/Nombre/);

describe('RoleScreen: ver y editar', () => {
  it('muestra el rol, su conteo y la matriz con sus permisos', async () => {
    renderScreen();

    expect(
      await screen.findByRole('heading', { name: 'Asesor comercial' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        '5 usuarios tienen este rol. Los cambios se aplican desde su siguiente acción en el panel.',
      ),
    ).toBeInTheDocument();
    expect(await nameInput()).toHaveValue('Asesor comercial');
    expect(checkbox('Usuarios: ver')).toBeChecked();
    expect(checkbox('Usuarios: gestionar')).not.toBeChecked();
  });

  it('sin roles.manage todo se ve, pero nada se edita', async () => {
    renderScreen({ permissions: ['roles.view'] });

    expect(await nameInput()).toBeDisabled();
    expect(screen.getByLabelText(/Descripción/)).toBeDisabled();
    expect(checkbox('Usuarios: ver')).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'Guardar cambios' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Borrar rol' }),
    ).not.toBeInTheDocument();
  });

  it('guarda el nombre, la descripción y la lista completa de permisos, y vuelve a la lista', async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.clear(await nameInput());
    await user.type(screen.getByLabelText(/Nombre/), 'Ventas');
    await user.click(checkbox('Roles y permisos: gestionar'));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await vi.waitFor(() => expect(router.push).toHaveBeenCalledWith('/roles'));
    expect(readRoleNotice('list')).toBe('Cambios guardados en Ventas.');
    expect(saved).toEqual({
      name: 'Ventas',
      description: 'Clientes, viajeros, solicitudes y borradores.',
      permissions: ['users.view', 'roles.view', 'roles.manage'],
    });
  });

  it('"Descartar cambios" vuelve a lo guardado', async () => {
    const user = userEvent.setup();
    renderScreen();
    const discard = async () =>
      screen.findByRole('button', { name: 'Descartar cambios' });

    expect(await discard()).toBeDisabled();
    await user.type(await nameInput(), ' 2');
    await user.click(checkbox('Usuarios: ver'));
    await user.click(await discard());

    expect(screen.getByLabelText(/Nombre/)).toHaveValue('Asesor comercial');
    expect(checkbox('Usuarios: ver')).toBeChecked();
  });

  it('un conflicto muestra el motivo que da la API', async () => {
    server.use(
      http.put(apiUrl('/api/roles/2'), () =>
        conflict(
          'cannot_edit_own_role',
          'No puedes cambiar los permisos del rol que tienes asignado.',
        ),
      ),
    );
    const user = userEvent.setup();
    renderScreen();

    await user.click(
      await screen.findByRole('checkbox', { name: 'Usuarios: gestionar' }),
    );
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(
      await screen.findByText(
        'No puedes cambiar los permisos del rol que tienes asignado.',
      ),
    ).toBeInTheDocument();
  });

  it('muestra el aviso que deja el alta', async () => {
    setRoleNotice({ target: 2, text: 'Rol creado.' });
    renderScreen();

    expect(await screen.findByText('Rol creado.')).toBeInTheDocument();
  });
});

describe('RoleScreen: rol protegido', () => {
  beforeEach(() => {
    serveRole(
      buildRoleDetail({
        id: 2,
        name: 'Administrador',
        is_protected: true,
        permissions: PERMISSION_CATALOG.map((item) => item.code),
      }),
    );
  });

  it('solo deja cambiar la descripción', async () => {
    renderScreen();

    expect(await nameInput()).toBeDisabled();
    expect(screen.getByLabelText(/Descripción/)).toBeEnabled();
    for (const box of screen.getAllByRole('checkbox')) {
      expect(box).toBeChecked();
      expect(box).toBeDisabled();
    }
    expect(
      screen.getByText(
        'El rol Administrador siempre tiene todos los permisos. Solo se puede cambiar su descripción.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Guardar cambios' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Borrar rol' }),
    ).not.toBeInTheDocument();
  });

  it('guarda la descripción con el nombre y los permisos que ya tenía', async () => {
    const user = userEvent.setup();
    renderScreen();

    const description = await screen.findByLabelText(/Descripción/);
    await user.clear(description);
    await user.type(description, 'Dueño de la agencia');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await vi.waitFor(() => expect(router.push).toHaveBeenCalledWith('/roles'));
    expect(readRoleNotice('list')).toBe('Cambios guardados en Administrador.');
    expect(saved).toEqual({
      name: 'Administrador',
      description: 'Dueño de la agencia',
      permissions: PERMISSION_CATALOG.map((item) => item.code),
    });
  });
});

describe('RoleScreen: borrar', () => {
  it('con personas en el rol no se ofrece, y se explica por qué', async () => {
    renderScreen();

    expect(
      await screen.findByText(
        'Para borrar este rol, primero cambia el rol de las personas que lo tienen.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Borrar rol' }),
    ).not.toBeInTheDocument();
  });

  it('pide confirmación; cancelar no borra', async () => {
    let deleted = 0;
    serveRole(
      buildRoleDetail({ id: 2, user_count: 0, inactive_user_count: 0 }),
    );
    server.use(
      http.delete(apiUrl('/api/roles/2'), () => {
        deleted += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderScreen();

    await user.click(await screen.findByRole('button', { name: 'Borrar rol' }));
    const dialog = screen.getByRole('alertdialog');
    expect(
      within(dialog).getByRole('heading', {
        name: '¿Borrar el rol Asesor comercial?',
      }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText('Esta acción no se puede deshacer.'),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    expect(deleted).toBe(0);
  });

  it('al confirmar, borra y vuelve a la lista con el aviso', async () => {
    serveRole(
      buildRoleDetail({ id: 2, user_count: 0, inactive_user_count: 0 }),
    );
    server.use(
      http.delete(
        apiUrl('/api/roles/2'),
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const user = userEvent.setup();
    renderScreen();

    await user.click(await screen.findByRole('button', { name: 'Borrar rol' }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Borrar rol',
      }),
    );

    await vi.waitFor(() => expect(router.push).toHaveBeenCalledWith('/roles'));
    expect(readRoleNotice('list')).toBe('Rol borrado.');
    // El rol borrado no se vuelve a pedir: daría 404 mientras la pantalla se va.
    expect(roleRequests).toBe(1);
  });

  it('si alguien tomó el rol mientras tanto, lo dice dentro del diálogo', async () => {
    serveRole(
      buildRoleDetail({ id: 2, user_count: 0, inactive_user_count: 0 }),
    );
    server.use(
      http.delete(apiUrl('/api/roles/2'), () =>
        conflict(
          'role_in_use',
          'Este rol tiene usuarios asignados. Cámbiales el rol antes de borrarlo.',
        ),
      ),
    );
    const user = userEvent.setup();
    renderScreen();

    await user.click(await screen.findByRole('button', { name: 'Borrar rol' }));
    const dialog = screen.getByRole('alertdialog');
    await user.click(
      within(dialog).getByRole('button', { name: 'Borrar rol' }),
    );

    expect(
      await within(dialog).findByText(
        'Este rol tiene usuarios asignados. Cámbiales el rol antes de borrarlo.',
      ),
    ).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });
});

describe('RoleScreen: no encontrado', () => {
  it('un id inexistente muestra "No encontramos este rol"', async () => {
    server.use(
      http.get(apiUrl('/api/roles/99'), () =>
        HttpResponse.json(
          { detail: 'No encontrado.', code: 'not_found', fields: {} },
          { status: 404 },
        ),
      ),
    );
    renderScreen({ id: '99' });

    expect(
      await screen.findByText('No encontramos este rol'),
    ).toBeInTheDocument();
  });

  it('un id imposible no llama a la API', async () => {
    renderScreen({ id: 'abc' });

    expect(
      await screen.findByText('No encontramos este rol'),
    ).toBeInTheDocument();
    expect(roleRequests).toBe(0);
  });
});

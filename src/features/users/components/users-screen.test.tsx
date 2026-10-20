import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { OnUrlUpdateFunction } from 'nuqs/adapters/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';
import { ROLES, buildUserListItem, buildUserPage } from '@/test/users';

import { UsersScreen } from './users-screen';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

let requests: URLSearchParams[] = [];

beforeEach(() => {
  requests = [];
  server.use(
    http.get(apiUrl('/api/users'), ({ request }) => {
      requests.push(new URL(request.url).searchParams);
      return HttpResponse.json(buildUserPage());
    }),
    http.get(apiUrl('/api/roles'), () => HttpResponse.json(ROLES)),
  );
});

const lastRequest = () => Object.fromEntries(requests.at(-1)!);

const renderScreen = ({
  permissions = ['users.view', 'users.manage'],
  searchParams = '',
  onUrlUpdate,
}: {
  permissions?: string[];
  searchParams?: string;
  onUrlUpdate?: OnUrlUpdateFunction;
} = {}) => {
  server.use(sessionHandler(buildSession({ permissions })));
  return renderWithProviders(
    <SessionGuard>
      <UsersScreen />
    </SessionGuard>,
    { searchParams, onUrlUpdate },
  );
};

describe('UsersScreen', () => {
  it('lee los filtros de la URL y los envía a la API', async () => {
    renderScreen({ searchParams: '?q=laura&status=inactive&role_id=2&page=3' });

    await screen.findByText('Laura Rojas');
    expect(lastRequest()).toEqual({
      q: 'laura',
      status: 'inactive',
      role_id: '2',
      page: '3',
      page_size: '20',
    });
    expect(screen.getByRole('searchbox')).toHaveValue('laura');
    expect(screen.getByRole('button', { name: 'Inactivos' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it.each([['0'], ['-3'], ['abc'], ['9007199254740993']])(
    'un role_id imposible en la URL (%s) no se envía a la API',
    async (roleId) => {
      renderScreen({ searchParams: `?role_id=${roleId}` });

      await screen.findByText('Laura Rojas');
      expect(lastRequest()).not.toHaveProperty('role_id');
    },
  );

  it('buscar escribe q en la URL y vuelve a la primera página', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderScreen({ searchParams: '?page=2', onUrlUpdate });
    await screen.findByText('Laura Rojas');

    await userEvent.setup().type(screen.getByRole('searchbox'), 'rojas');

    await waitFor(() => expect(lastRequest().q).toBe('rojas'));
    const { queryString } = onUrlUpdate.mock.lastCall![0];
    expect(queryString).toBe('?q=rojas');
    // Se espera a que la persona deje de escribir: no se pide una lista por tecla.
    expect(requests.filter((query) => query.has('q'))).toHaveLength(1);
  });

  it('las pestañas y el rol escriben en la URL y borran la página', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderScreen({ searchParams: '?page=2', onUrlUpdate });
    await screen.findByText('Laura Rojas');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Activos' }));
    expect(onUrlUpdate.mock.lastCall![0].queryString).toBe('?status=active');

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Rol' }),
      'Operativo',
    );
    expect(onUrlUpdate.mock.lastCall![0].queryString).toBe(
      '?status=active&role_id=4',
    );
    await waitFor(() =>
      expect(lastRequest()).toMatchObject({ status: 'active', role_id: '4' }),
    );
  });

  it('muestra el estado de cada fila y "Nunca" sin actividad', async () => {
    server.use(
      http.get(apiUrl('/api/users'), () =>
        HttpResponse.json(
          buildUserPage([
            buildUserListItem({ id: 1, full_name: 'Ana Activa' }),
            buildUserListItem({
              id: 2,
              full_name: 'Iván Invitado',
              invitation_pending: true,
              last_activity_at: null,
            }),
            buildUserListItem({
              id: 3,
              full_name: 'Inés Inactiva',
              is_active: false,
            }),
          ]),
        ),
      ),
    );
    renderScreen();

    const rowOf = async (name: string) =>
      (await screen.findByRole('link', { name })).closest('tr')!;
    expect(within(await rowOf('Ana Activa')).getByText('Activo')).toBeVisible();
    const invited = await rowOf('Iván Invitado');
    expect(within(invited).getByText('Invitación pendiente')).toBeVisible();
    expect(within(invited).getByText('Nunca')).toBeVisible();
    expect(
      within(await rowOf('Inés Inactiva')).getByText('Inactivo'),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Ana Activa' })).toHaveAttribute(
      'href',
      '/usuarios/1',
    );
  });

  it('sin resultados muestra el estado vacío y permite limpiar los filtros', async () => {
    server.use(
      http.get(apiUrl('/api/users'), ({ request }) => {
        requests.push(new URL(request.url).searchParams);
        const q = new URL(request.url).searchParams.get('q');
        return HttpResponse.json(buildUserPage(q ? [] : undefined));
      }),
    );
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderScreen({ searchParams: '?q=nadie&status=active', onUrlUpdate });

    expect(
      await screen.findByText('No hay usuarios que coincidan con la búsqueda'),
    ).toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    expect(onUrlUpdate.mock.lastCall![0].queryString).toBe('');
    expect(await screen.findByText('Laura Rojas')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });

  it('pagina con Siguiente y muestra el rango', async () => {
    server.use(
      http.get(apiUrl('/api/users'), ({ request }) => {
        requests.push(new URL(request.url).searchParams);
        return HttpResponse.json(
          buildUserPage([buildUserListItem()], {
            count: 45,
            next: 'http://api/users?page=2',
          }),
        );
      }),
    );
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderScreen({ onUrlUpdate });

    expect(await screen.findByText('1–20 de 45')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(onUrlUpdate.mock.lastCall![0].queryString).toBe('?page=2');
  });

  it('una página fuera de rango vuelve a la primera', async () => {
    server.use(
      http.get(apiUrl('/api/users'), ({ request }) => {
        const query = new URL(request.url).searchParams;
        requests.push(query);
        return query.get('page') === '3'
          ? HttpResponse.json(
              { detail: 'No encontrado.', code: 'not_found', fields: {} },
              { status: 404 },
            )
          : HttpResponse.json(buildUserPage());
      }),
    );
    renderScreen({ searchParams: '?page=3' });

    expect(await screen.findByText('Laura Rojas')).toBeInTheDocument();
    expect(lastRequest().page).toBe('1');
  });

  it('sin users.manage no muestra "Nuevo usuario"', async () => {
    renderScreen({ permissions: ['users.view'] });

    await screen.findByText('Laura Rojas');
    expect(
      screen.queryByRole('link', { name: 'Nuevo usuario' }),
    ).not.toBeInTheDocument();
  });

  it('con users.manage "Nuevo usuario" lleva al alta', async () => {
    renderScreen();

    expect(
      await screen.findByRole('link', { name: 'Nuevo usuario' }),
    ).toHaveAttribute('href', '/usuarios/nuevo');
  });

  it('un 403 de la API muestra el estado sin permiso', async () => {
    server.use(
      http.get(apiUrl('/api/users'), () =>
        HttpResponse.json(
          { detail: 'Sin permiso.', code: 'permission_denied', fields: {} },
          { status: 403 },
        ),
      ),
    );
    renderScreen();

    expect(
      await screen.findByText('No tienes acceso a esta sección'),
    ).toBeInTheDocument();
  });
});

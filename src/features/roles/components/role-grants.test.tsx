import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { apiUrl } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { PERMISSION_CATALOG, buildRoleDetail } from '@/test/roles';
import { server } from '@/test/server';

import { RoleGrants } from './role-grants';

beforeEach(() => {
  server.use(
    http.get(apiUrl('/api/permissions'), () =>
      HttpResponse.json(PERMISSION_CATALOG),
    ),
  );
});

const serveRole = (id: number, permissions: string[]) =>
  server.use(
    http.get(apiUrl(`/api/roles/${id}`), () =>
      HttpResponse.json(buildRoleDetail({ id, permissions })),
    ),
  );

describe('RoleGrants', () => {
  it('resume lo que autoriza el rol, por grupo', async () => {
    serveRole(2, ['users.view', 'users.manage', 'roles.view']);
    renderWithProviders(<RoleGrants roleId={2} />);

    expect(
      await screen.findByText('Usuarios: ver y gestionar'),
    ).toBeInTheDocument();
    expect(screen.getByText('Roles y permisos: ver')).toBeInTheDocument();
  });

  it('sin permisos, dice que solo verá la página principal', async () => {
    serveRole(4, []);
    renderWithProviders(<RoleGrants roleId={4} />);

    expect(
      await screen.findByText('Solo verá la página principal.'),
    ).toBeInTheDocument();
  });

  it('si no carga, lo dice', async () => {
    server.use(
      http.get(apiUrl('/api/roles/2'), () =>
        HttpResponse.json(
          { detail: 'Error.', code: 'server_error', fields: {} },
          { status: 500 },
        ),
      ),
    );
    renderWithProviders(<RoleGrants roleId={2} />);

    expect(
      await screen.findByText('No pudimos cargar lo que autoriza este rol.'),
    ).toBeInTheDocument();
  });
});

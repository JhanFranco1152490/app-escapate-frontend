import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { RequirePermission } from './require-permission';
import { SessionGuard } from './session-guard';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

const renderWith = (permissions: string[], codes: string[]) => {
  server.use(sessionHandler(buildSession({ permissions })));
  renderWithProviders(
    <SessionGuard>
      <RequirePermission codes={codes}>
        <p>Contenido protegido</p>
      </RequirePermission>
    </SessionGuard>,
  );
};

describe('RequirePermission', () => {
  it('con todos los permisos muestra el contenido', async () => {
    renderWith(['users.view', 'users.manage'], ['users.view', 'users.manage']);

    expect(await screen.findByText('Contenido protegido')).toBeInTheDocument();
  });

  it('si falta uno muestra el estado sin permiso', async () => {
    renderWith(['users.view'], ['users.view', 'users.manage']);

    expect(
      await screen.findByText('No tienes acceso a esta sección'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
  });
});

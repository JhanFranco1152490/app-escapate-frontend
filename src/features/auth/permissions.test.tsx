import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { SessionGuard } from './components/session-guard';
import { hasPermission, useHasPermission } from './permissions';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

describe('hasPermission', () => {
  const session = buildSession({ permissions: ['clients.read'] });

  it('es verdadero si el rol tiene el permiso', () => {
    expect(hasPermission(session, 'clients.read')).toBe(true);
  });

  it('es falso si el rol no tiene el permiso', () => {
    expect(hasPermission(session, 'clients.delete')).toBe(false);
  });

  it('es falso sin sesión', () => {
    expect(hasPermission(undefined, 'clients.read')).toBe(false);
  });
});

function Menu() {
  const canRead = useHasPermission('clients.read');
  const canDelete = useHasPermission('clients.delete');
  return (
    <ul>
      <li>Inicio</li>
      {canRead && <li>Clientes</li>}
      {canDelete && <li>Borrar clientes</li>}
    </ul>
  );
}

describe('useHasPermission', () => {
  it('muestra solo las entradas para las que el rol tiene permiso', async () => {
    server.use(sessionHandler(buildSession({ permissions: ['clients.read'] })));
    renderWithProviders(
      <SessionGuard>
        <Menu />
      </SessionGuard>,
    );

    expect(await screen.findByText('Clientes')).toBeInTheDocument();
    expect(screen.queryByText('Borrar clientes')).not.toBeInTheDocument();
  });
});

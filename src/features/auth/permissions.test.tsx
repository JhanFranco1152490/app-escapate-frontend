import { waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { sessionHandler } from '@/test/handlers';
import { renderHookWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { hasPermission, useHasPermission } from './permissions';

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

describe('useHasPermission', () => {
  it('lee los permisos de la sesión', async () => {
    server.use(sessionHandler(buildSession({ permissions: ['clients.read'] })));

    const { result } = renderHookWithProviders(() => ({
      canRead: useHasPermission('clients.read'),
      canDelete: useHasPermission('clients.delete'),
    }));

    await waitFor(() => expect(result.current.canRead).toBe(true));
    expect(result.current.canDelete).toBe(false);
  });
});

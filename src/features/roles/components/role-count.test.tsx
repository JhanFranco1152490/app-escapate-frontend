import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { buildRoleListItem } from '@/test/roles';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { RoleCount, roleCountText } from './role-count';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

describe('roleCountText', () => {
  it.each([
    [0, 0, 'Sin usuarios'],
    [1, 0, '1 usuario'],
    [5, 0, '5 usuarios'],
    [5, 1, '5 usuarios · 1 inactivo'],
    [5, 2, '5 usuarios · 2 inactivos'],
    [1, 1, '1 usuario · 1 inactivo'],
  ])('%i personas, %i inactivas → %s', (total, inactive, text) => {
    expect(roleCountText(total, inactive)).toBe(text);
  });
});

describe('RoleCount', () => {
  const renderCount = (permissions: string[]) => {
    server.use(sessionHandler(buildSession({ permissions })));
    return renderWithProviders(
      <SessionGuard>
        <RoleCount role={buildRoleListItem({ id: 2 })} />
      </SessionGuard>,
    );
  };

  it('con users.view enlaza a los usuarios filtrados por el rol', async () => {
    renderCount(['roles.view', 'users.view']);

    const link = await screen.findByRole('link', {
      name: '5 usuarios · 1 inactivo',
    });
    expect(link).toHaveAttribute('href', '/usuarios?role_id=2');
  });

  it('sin users.view es solo texto', async () => {
    renderCount(['roles.view']);

    expect(
      await screen.findByText('5 usuarios · 1 inactivo'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});

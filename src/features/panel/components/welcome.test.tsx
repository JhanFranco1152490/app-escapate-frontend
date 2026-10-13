import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { Welcome } from './welcome';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

describe('Welcome', () => {
  it('saluda a la persona por su primer nombre', async () => {
    server.use(
      sessionHandler(buildSession({ full_name: 'Persona de Prueba' })),
    );
    renderWithProviders(
      <SessionGuard>
        <Welcome />
      </SessionGuard>,
    );

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Hola, Persona' }),
    ).toBeInTheDocument();
  });
});

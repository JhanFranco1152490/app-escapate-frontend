import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { buildPage } from '@/test/clients';
import type { components } from '@/lib/api/schema';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { FollowUpsScreen } from './follow-ups-screen';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

type FollowUp = components['schemas']['FollowUpOut'];

const followUp = (overrides: Partial<FollowUp> = {}): FollowUp => ({
  id: 5,
  quote: {
    id: 12,
    code: 'COT-0012',
    destination: 'San Andrés',
    client: { id: 7, display_name: 'Marcela Gómez Ortiz' },
  },
  due_date: '2026-11-19',
  channel: 'whatsapp',
  purpose: 'Confirmar si revisó la propuesta',
  status: 'pending',
  alert: 'red',
  outcome: null,
  done_at: null,
  done_by: null,
  created_by: { id: 2, full_name: 'Andrés Peña' },
  created_at: '2026-11-18T15:00:00Z',
  ...overrides,
});

const render = (
  rows: FollowUp[],
  searchParams: Record<string, string> = {},
) => {
  const queries: URLSearchParams[] = [];
  server.use(
    sessionHandler(buildSession({ permissions: ['quotes.view'] })),
    http.get(apiUrl('/api/follow-ups'), ({ request }) => {
      queries.push(new URL(request.url).searchParams);
      return HttpResponse.json(buildPage(rows));
    }),
    http.get(apiUrl('/api/follow-ups/alerts'), () =>
      HttpResponse.json({ red: 2, yellow: 3, green: 9 }),
    ),
  );
  renderWithProviders(
    <SessionGuard>
      <FollowUpsScreen />
    </SessionGuard>,
    { searchParams },
  );
  return queries;
};

describe('FollowUpsScreen', () => {
  it('empieza por los vencidos y muestra los conteos del semáforo en las pestañas', async () => {
    const queries = render([followUp()]);

    expect(
      await screen.findByText('Confirmar si revisó la propuesta'),
    ).toBeVisible();
    expect(
      await screen.findByRole('button', { name: 'Vencidos · 2' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Hoy y mañana · 3' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Próximos · 9' })).toBeVisible();
    expect(queries[0].get('status')).toBe('pending');
    expect(queries[0].get('alert')).toBe('red');
  });

  it('cambiar de pestaña pide el color o los registrados', async () => {
    const user = userEvent.setup();
    const queries = render([followUp()]);

    await screen.findByText('Confirmar si revisó la propuesta');
    await user.click(screen.getByRole('button', { name: /^Hoy y mañana/ }));
    await waitFor(() =>
      expect(queries.some((query) => query.get('alert') === 'yellow')).toBe(
        true,
      ),
    );

    await user.click(screen.getByRole('button', { name: 'Registrados' }));
    await waitFor(() =>
      expect(queries.some((query) => query.get('status') === 'done')).toBe(
        true,
      ),
    );
    expect(queries.at(-1)?.get('alert')).toBeNull();
  });

  it('sin seguimientos en la pestaña lo dice', async () => {
    render([]);

    expect(await screen.findByText('Nada por aquí')).toBeVisible();
  });
});

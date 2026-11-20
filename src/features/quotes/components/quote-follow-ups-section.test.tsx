import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import type { components } from '@/lib/api/schema';
import { buildPage } from '@/test/clients';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { buildQuoteDetail } from '@/test/quotes';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { QuoteFollowUpsSection } from './quote-follow-ups-section';

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

describe('QuoteFollowUpsSection', () => {
  it('muestra el semáforo, programa y registra seguimientos', async () => {
    const user = userEvent.setup();
    const sent: { path: string; body: unknown }[] = [];
    server.use(
      sessionHandler(
        buildSession({ permissions: ['quotes.view', 'quotes.manage'] }),
      ),
      http.get(apiUrl('/api/follow-ups'), () =>
        HttpResponse.json(buildPage([followUp()])),
      ),
      http.post(apiUrl('/api/quotes/12/follow-ups'), async ({ request }) => {
        sent.push({ path: 'schedule', body: await request.json() });
        return HttpResponse.json(followUp({ id: 6 }), { status: 201 });
      }),
      http.post(apiUrl('/api/follow-ups/5/complete'), async ({ request }) => {
        sent.push({ path: 'complete', body: await request.json() });
        return HttpResponse.json(followUp({ status: 'done', alert: null }));
      }),
    );
    renderWithProviders(
      <SessionGuard>
        <QuoteFollowUpsSection quote={buildQuoteDetail({ status: 'sent' })} />
      </SessionGuard>,
    );

    expect(await screen.findByText('Vencido')).toBeVisible();

    await user.type(screen.getByLabelText('Fecha'), '2026-11-25');
    await user.type(screen.getByLabelText('Para qué'), 'Llamar para cerrar');
    await user.click(screen.getByRole('button', { name: 'Programar' }));
    expect(await screen.findByText('Seguimiento programado.')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Registrar' }));
    const dialog = await screen.findByRole('alertdialog');
    await user.type(
      within(dialog).getByLabelText('¿Qué respondió el cliente?'),
      'Lo está pensando',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Registrar' }));

    expect(await screen.findByText('Seguimiento registrado.')).toBeVisible();
    expect(sent).toEqual([
      {
        path: 'schedule',
        body: {
          due_date: '2026-11-25',
          channel: 'whatsapp',
          purpose: 'Llamar para cerrar',
        },
      },
      {
        path: 'complete',
        body: { outcome: 'Lo está pensando', next_due_date: null },
      },
    ]);
  });
});

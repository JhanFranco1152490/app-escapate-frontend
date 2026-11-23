import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { buildQuoteDetail, buildQuoteItem } from '@/test/quotes';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import type { QuoteDetail } from '../api';
import { QuoteDetailScreen } from './quote-detail-screen';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

const ALL = [
  'quotes.view',
  'quotes.manage',
  'clients.view',
  'travel_requests.view',
];

let current: QuoteDetail;
let posted: { path: string; body: unknown }[] = [];

const serve = (quote: QuoteDetail) => {
  current = quote;
  server.use(
    http.get(apiUrl(`/api/quotes/${quote.id}`), () =>
      HttpResponse.json(current),
    ),
  );
};

beforeEach(() => {
  posted = [];
});

const renderScreen = (quote: QuoteDetail, permissions = ALL) => {
  serve(quote);
  server.use(sessionHandler(buildSession({ permissions })));
  renderWithProviders(
    <SessionGuard>
      <QuoteDetailScreen id={String(quote.id)} />
    </SessionGuard>,
  );
};

const heading = () =>
  screen.findByRole('heading', { name: 'Cotización COT-0012' });

describe('QuoteDetailScreen', () => {
  it('muestra el viaje, los servicios y de qué solicitud sale', async () => {
    renderScreen(
      buildQuoteDetail({
        items: [
          buildQuoteItem(),
          buildQuoteItem({
            id: 41,
            name: 'Tour en lancha',
            is_optional: true,
            service_type: 'tours',
            charge_unit: 'per_person',
            quantity: 3,
            unit_cost: '120000',
          }),
        ],
      }),
    );

    expect(await heading()).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'SOL-0231' })).toHaveAttribute(
      'href',
      '/solicitudes/231',
    );
    const services = screen.getByRole('region', { name: 'Servicios' });
    expect(within(services).getByText('Hotel Las Américas')).toBeVisible();
    expect(within(services).getByText('Opcional')).toBeVisible();
  });

  it('un borrador se edita y se marca como enviado', async () => {
    const user = userEvent.setup();
    renderScreen(buildQuoteDetail({ items: [buildQuoteItem()] }));
    server.use(
      http.post(apiUrl('/api/quotes/12/send'), async ({ request }) => {
        posted.push({ path: 'send', body: await request.json() });
        current = buildQuoteDetail({
          status: 'sent',
          sent_at: '2026-11-20T16:00:00Z',
          version: 2,
          items: [buildQuoteItem()],
        });
        return HttpResponse.json(current);
      }),
    );

    await heading();
    expect(
      screen.getByRole('link', { name: /Datos generales/ }),
    ).toHaveAttribute('href', '/cotizaciones/12/editar');
    await user.click(
      screen.getByRole('button', { name: 'Marcar como enviada' }),
    );

    expect(
      await screen.findByText('Cotización enviada. Ya no se puede editar.'),
    ).toBeVisible();
    expect(posted).toEqual([{ path: 'send', body: { expected_version: 1 } }]);
    expect(screen.queryByRole('link', { name: /Datos generales/ })).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Agregar servicio' }),
    ).toBeNull();
  });

  it('aceptar pide confirmación', async () => {
    const user = userEvent.setup();
    renderScreen(
      buildQuoteDetail({
        status: 'sent',
        sent_at: '2026-11-20T16:00:00Z',
        items: [buildQuoteItem()],
      }),
    );
    server.use(
      http.post(apiUrl('/api/quotes/12/accept'), () => {
        current = {
          ...current,
          status: 'accepted',
          decided_at: '2026-11-21T10:00:00Z',
          version: 2,
        };
        return HttpResponse.json(current);
      }),
    );

    await heading();
    await user.click(screen.getByRole('button', { name: 'El cliente aceptó' }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(
      within(dialog).getByRole('button', { name: 'El cliente aceptó' }),
    );

    expect(await screen.findByText('Cotización aceptada.')).toBeVisible();
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Volver a borrador' }),
      ).toBeNull(),
    );
  });

  it('una vencida avisa qué hacer', async () => {
    renderScreen(
      buildQuoteDetail({
        status: 'sent',
        is_expired: true,
        sent_at: '2026-11-10T16:00:00Z',
      }),
    );

    expect(
      await screen.findByText('La vigencia de esta cotización ya pasó.'),
    ).toBeVisible();
  });

  it('avisa que falta la tasa de cambio y que así no se puede enviar', async () => {
    const quote = buildQuoteDetail({ items: [buildQuoteItem()] });
    renderScreen({
      ...quote,
      totals: { ...quote.totals, missing_exchange_rate: true },
    });

    expect(
      await screen.findByText(
        'Hay servicios en dólares y falta la tasa de cambio.',
      ),
    ).toBeVisible();
    expect(screen.getByText(/la cotización no se puede enviar/)).toBeVisible();
  });

  it('enviar sin la tasa de cambio muestra el motivo y sigue en borrador', async () => {
    const user = userEvent.setup();
    renderScreen(buildQuoteDetail({ items: [buildQuoteItem()] }));
    server.use(
      http.post(apiUrl('/api/quotes/12/send'), () =>
        HttpResponse.json(
          {
            detail:
              'Hay servicios en dólares y la cotización no tiene tasa de cambio. Agrégala en los precios antes de enviarla.',
            code: 'exchange_rate_missing',
            fields: {},
          },
          { status: 409 },
        ),
      ),
    );

    await heading();
    await user.click(
      screen.getByRole('button', { name: 'Marcar como enviada' }),
    );

    expect(await screen.findByText(/no tiene tasa de cambio/)).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Marcar como enviada' }),
    ).toBeEnabled();
  });

  it('sin permiso de gestión no hay acciones', async () => {
    renderScreen(buildQuoteDetail({ items: [buildQuoteItem()] }), [
      'quotes.view',
    ]);

    await heading();
    expect(
      screen.queryByRole('button', { name: 'Marcar como enviada' }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Agregar servicio' }),
    ).toBeNull();
  });
});

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { buildQuoteDetail, buildQuoteItem } from '@/test/quotes';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { QuoteItemsSection } from './quote-items-section';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

const renderSection = () => {
  const quote = buildQuoteDetail();
  server.use(
    sessionHandler(
      buildSession({ permissions: ['quotes.view', 'quotes.manage'] }),
    ),
    http.get(apiUrl('/api/quotes/12'), () => HttpResponse.json(quote)),
  );
  renderWithProviders(
    <SessionGuard>
      <QuoteItemsSection quote={quote} />
    </SessionGuard>,
  );
};

describe('QuoteItemsSection', () => {
  it('agrega un servicio escrito como en Colombia', async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      http.post(apiUrl('/api/quotes/12/items'), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(buildQuoteItem(), { status: 201 });
      }),
    );
    renderSection();

    await user.click(
      await screen.findByRole('button', { name: 'Agregar servicio' }),
    );
    const panel = screen.getByRole('complementary', { name: 'Nuevo servicio' });
    await user.type(
      within(panel).getByLabelText(/^Servicio/),
      'Hotel Las Américas',
    );
    await user.clear(within(panel).getByLabelText(/^Cantidad/));
    await user.type(within(panel).getByLabelText(/^Cantidad/), '6');
    await user.type(within(panel).getByLabelText(/^Costo/), '450.000');
    await user.clear(within(panel).getByLabelText(/^% de ganancia/));
    await user.type(within(panel).getByLabelText(/^% de ganancia/), '12,5');
    await user.click(
      within(panel).getByRole('button', { name: 'Guardar servicio' }),
    );

    expect(await screen.findByText('Servicio agregado.')).toBeVisible();
    expect(body).toMatchObject({
      service_type: 'lodging',
      name: 'Hotel Las Américas',
      quantity: 6,
      charge_unit: 'per_night',
      currency: 'COP',
      unit_cost: '450000',
      markup_percent: '12.5',
      is_optional: false,
    });
  });

  it('no envía un costo con centavos en pesos', async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(
      await screen.findByRole('button', { name: 'Agregar servicio' }),
    );
    const panel = screen.getByRole('complementary', { name: 'Nuevo servicio' });
    await user.type(within(panel).getByLabelText(/^Servicio/), 'Hotel');
    await user.type(within(panel).getByLabelText(/^Costo/), '450.000,50');
    await user.click(
      within(panel).getByRole('button', { name: 'Guardar servicio' }),
    );

    expect(
      await within(panel).findByText('En pesos el valor va sin decimales.'),
    ).toBeVisible();
  });
});

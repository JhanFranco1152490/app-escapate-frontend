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

const base = buildQuoteItem({
  id: 1,
  name: 'Hotel estándar',
  quality_level: 'standard',
});
const option = buildQuoteItem({
  id: 2,
  name: 'Hotel superior',
  quality_level: 'superior',
  alternative_of_id: 1,
});

const renderSection = () => {
  const quote = buildQuoteDetail({ items: [base, option] });
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

describe('Borrador de alternativas', () => {
  it('muestra el nivel de cada opción y solo ofrece usar la alternativa', async () => {
    renderSection();

    expect(await screen.findByText('Estándar')).toBeVisible();
    expect(screen.getByText('Superior')).toBeVisible();
    expect(
      screen.getByRole('button', {
        name: 'Usar Hotel superior en la cotización',
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', {
        name: 'Usar Hotel estándar en la cotización',
      }),
    ).not.toBeInTheDocument();
  });

  it('usar la alternativa la pasa a la cotización', async () => {
    const user = userEvent.setup();
    let called = false;
    server.use(
      http.post(apiUrl('/api/quotes/12/items/2/choose'), () => {
        called = true;
        return HttpResponse.json(
          buildQuoteDetail({
            items: [
              { ...option, alternative_of_id: null },
              { ...base, alternative_of_id: 2 },
            ],
          }),
        );
      }),
    );
    renderSection();

    await user.click(
      await screen.findByRole('button', {
        name: 'Usar Hotel superior en la cotización',
      }),
    );

    expect(
      await screen.findByText(/Hotel superior pasa a la cotización/),
    ).toBeVisible();
    expect(called).toBe(true);
  });

  it('si la cotización ya no es borrador muestra el motivo', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(apiUrl('/api/quotes/12/items/2/choose'), () =>
        HttpResponse.json(
          {
            detail: 'Solo se edita una cotización en borrador.',
            code: 'quote_not_editable',
            fields: {},
          },
          { status: 409 },
        ),
      ),
    );
    renderSection();

    await user.click(
      await screen.findByRole('button', {
        name: 'Usar Hotel superior en la cotización',
      }),
    );

    expect(
      await screen.findByText('Solo se edita una cotización en borrador.'),
    ).toBeVisible();
  });

  it('el formulario envía el nivel elegido', async () => {
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
    await user.type(within(panel).getByLabelText(/^Servicio/), 'Hotel lujo');
    await user.type(within(panel).getByLabelText(/^Costo/), '900.000');
    await user.selectOptions(
      within(panel).getByLabelText(/^Nivel de calidad/),
      'luxury',
    );
    await user.selectOptions(
      within(panel).getByLabelText(/^Es alternativa de/),
      '1',
    );
    await user.click(
      within(panel).getByRole('button', { name: 'Guardar servicio' }),
    );

    expect(await screen.findByText('Servicio agregado.')).toBeVisible();
    expect(body).toMatchObject({
      quality_level: 'luxury',
      alternative_of_id: 1,
    });
  });
});

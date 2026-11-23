import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { buildPage } from '@/test/clients';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { buildSaleListItem } from '@/test/sales';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { SalesScreen } from './sales-screen';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

const render = (
  respond: (query: URLSearchParams) => Response,
  searchParams: Record<string, string> = {},
) => {
  const queries: URLSearchParams[] = [];
  server.use(
    sessionHandler(buildSession({ permissions: ['sales.view'] })),
    http.get(apiUrl('/api/sales'), ({ request }) => {
      const query = new URL(request.url).searchParams;
      queries.push(query);
      return respond(query);
    }),
  );
  renderWithProviders(
    <SessionGuard>
      <SalesScreen />
    </SessionGuard>,
    { searchParams },
  );
  return queries;
};

describe('SalesScreen', () => {
  it('lista las ventas con su cliente, viaje, saldo y estado de pago', async () => {
    render(() =>
      HttpResponse.json(
        buildPage([
          buildSaleListItem(),
          buildSaleListItem({
            id: 4,
            code: 'VEN-0004',
            client: { id: 8, display_name: 'Agencia Demostración SAS' },
            destination: 'Cartagena',
            departure_date: '2026-12-01',
            return_date: null,
            balance: 0,
            payment_status: 'paid',
          }),
          buildSaleListItem({
            id: 5,
            code: 'VEN-0005',
            departure_date: null,
            return_date: null,
            payment_status: 'pending',
          }),
        ]),
      ),
    );

    expect(
      await screen.findByRole('link', { name: 'VEN-0003' }),
    ).toHaveAttribute('href', '/ventas/3');
    const second = screen.getByRole('row', { name: /VEN-0004/ });
    expect(second).toHaveTextContent('Agencia Demostración SAS');
    expect(second).toHaveTextContent('Cartagena');
    expect(screen.getByRole('row', { name: /VEN-0003/ })).toHaveTextContent(
      /2\.500\.000/,
    );
    expect(screen.getByRole('row', { name: /VEN-0005/ })).toHaveTextContent(
      'Sin fechas',
    );
  });

  it('sin ventas explica cómo se registra una', async () => {
    render(() => HttpResponse.json(buildPage([])));

    expect(await screen.findByText('No hay ventas aquí')).toBeVisible();
  });

  it('filtrar por estado del pago pide solo ese estado', async () => {
    const user = userEvent.setup();
    const queries = render(() =>
      HttpResponse.json(buildPage([buildSaleListItem()])),
    );

    await screen.findByRole('link', { name: 'VEN-0003' });
    await user.click(screen.getByRole('button', { name: 'Pagadas' }));

    await waitFor(() =>
      expect(
        queries.some((query) => query.get('payment_status') === 'paid'),
      ).toBe(true),
    );
    expect(queries[0].get('payment_status')).toBeNull();
  });

  it('buscar pide la búsqueda al servidor', async () => {
    const user = userEvent.setup();
    const queries = render(() =>
      HttpResponse.json(buildPage([buildSaleListItem()])),
    );

    await screen.findByRole('link', { name: 'VEN-0003' });
    await user.type(screen.getByLabelText('Buscar venta'), 'Cartagena');

    await waitFor(() =>
      expect(queries.some((query) => query.get('q') === 'Cartagena')).toBe(
        true,
      ),
    );
  });

  it('con más de una página ofrece la siguiente', async () => {
    const user = userEvent.setup();
    const queries = render(() =>
      HttpResponse.json(
        buildPage([buildSaleListItem()], {
          count: 45,
          next: 'http://localhost:8000/api/sales?page=2',
        }),
      ),
    );

    await screen.findByRole('link', { name: 'VEN-0003' });
    await user.click(screen.getByRole('button', { name: /Siguiente/ }));

    await waitFor(() =>
      expect(queries.some((query) => query.get('page') === '2')).toBe(true),
    );
  });

  it('un fallo del servidor se avisa y se puede reintentar', async () => {
    const user = userEvent.setup();
    let calls = 0;
    render(() => {
      calls += 1;
      return calls === 1
        ? HttpResponse.json(
            { detail: 'Error', code: 'internal_error', fields: {} },
            { status: 500 },
          )
        : HttpResponse.json(buildPage([buildSaleListItem()]));
    });

    expect(
      await screen.findByText('No pudimos cargar las ventas'),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('link', { name: 'VEN-0003' })).toBeVisible();
  });
});

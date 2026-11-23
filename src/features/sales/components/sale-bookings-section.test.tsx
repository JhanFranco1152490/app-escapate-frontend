import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { buildPage } from '@/test/clients';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { buildBooking } from '@/test/sales';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { SaleBookingsSection } from './sale-bookings-section';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

const render = (permissions: string[]) => {
  server.use(sessionHandler(buildSession({ permissions })));
  renderWithProviders(
    <SessionGuard>
      <SaleBookingsSection saleId={3} />
    </SessionGuard>,
  );
};

describe('SaleBookingsSection', () => {
  it('cuenta las reservas confirmadas', async () => {
    server.use(
      http.get(apiUrl('/api/bookings'), () =>
        HttpResponse.json(
          buildPage([
            buildBooking(),
            buildBooking({
              id: 22,
              name: 'Tour en lancha',
              status: 'confirmed',
            }),
          ]),
        ),
      ),
    );
    render(['sales.view']);

    expect(await screen.findByText('1 de 2 confirmadas')).toBeVisible();
    expect(screen.getByText('Tour en lancha')).toBeVisible();
  });

  it('pide solo las reservas de esa venta', async () => {
    let query: URLSearchParams | undefined;
    server.use(
      http.get(apiUrl('/api/bookings'), ({ request }) => {
        query = new URL(request.url).searchParams;
        return HttpResponse.json(buildPage([buildBooking()]));
      }),
    );
    render(['sales.view']);

    await screen.findByText('Hotel Las Américas, 6 noches');

    expect(query?.get('sale_id')).toBe('3');
  });

  it('sin reservas explica cómo prepararlas', async () => {
    server.use(
      http.get(apiUrl('/api/bookings'), () => HttpResponse.json(buildPage([]))),
    );
    render(['sales.view']);

    expect(await screen.findByText(/Todavía no hay reservas/)).toBeVisible();
  });

  it('prepara las solicitudes y muestra las nuevas reservas', async () => {
    const user = userEvent.setup();
    let prepared = false;
    server.use(
      http.get(apiUrl('/api/bookings'), () =>
        HttpResponse.json(buildPage(prepared ? [buildBooking()] : [])),
      ),
      http.post(apiUrl('/api/sales/3/bookings/prepare'), () => {
        prepared = true;
        return HttpResponse.json([buildBooking()]);
      }),
    );
    render(['sales.view', 'sales.manage']);

    await user.click(
      await screen.findByRole('button', {
        name: 'Preparar solicitudes de reserva',
      }),
    );

    expect(
      await screen.findByText('Hotel Las Américas, 6 noches'),
    ).toBeVisible();
  });

  it('muestra el motivo si no se pudieron preparar', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(apiUrl('/api/bookings'), () => HttpResponse.json(buildPage([]))),
      http.post(apiUrl('/api/sales/3/bookings/prepare'), () =>
        HttpResponse.json(
          { detail: 'La venta ya no existe.', code: 'conflict', fields: {} },
          { status: 409 },
        ),
      ),
    );
    render(['sales.view', 'sales.manage']);

    await user.click(
      await screen.findByRole('button', {
        name: 'Preparar solicitudes de reserva',
      }),
    );

    expect(await screen.findByText('La venta ya no existe.')).toBeVisible();
  });

  it('sin permiso de gestión no se ofrece preparar', async () => {
    server.use(
      http.get(apiUrl('/api/bookings'), () => HttpResponse.json(buildPage([]))),
    );
    render(['sales.view']);

    await screen.findByText(/Todavía no hay reservas/);

    expect(
      screen.queryByRole('button', { name: 'Preparar solicitudes de reserva' }),
    ).not.toBeInTheDocument();
  });
});

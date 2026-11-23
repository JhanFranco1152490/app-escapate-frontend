import { screen, waitFor } from '@testing-library/react';
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

import { BookingsScreen } from './bookings-screen';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

type Booking = ReturnType<typeof buildBooking>;

const render = (bookings: Booking[]) => {
  const queries: URLSearchParams[] = [];
  server.use(
    sessionHandler(buildSession({ permissions: ['sales.view'] })),
    http.get(apiUrl('/api/bookings'), ({ request }) => {
      queries.push(new URL(request.url).searchParams);
      return HttpResponse.json(buildPage(bookings));
    }),
  );
  renderWithProviders(
    <SessionGuard>
      <BookingsScreen />
    </SessionGuard>,
  );
  return queries;
};

describe('BookingsScreen', () => {
  it('empieza por lo que falta solicitar y enlaza cada reserva a su venta', async () => {
    const queries = render([buildBooking()]);

    expect(
      await screen.findByRole('link', { name: 'VEN-0003 · San Andrés' }),
    ).toHaveAttribute('href', '/ventas/3');
    expect(queries[0].get('status')).toBe('to_request');
  });

  it('sin reservas en ese estado lo dice', async () => {
    render([]);

    expect(await screen.findByText('Nada por aquí')).toBeVisible();
  });

  it('cambiar de pestaña pide ese estado, y "Todas" no filtra', async () => {
    const user = userEvent.setup();
    const queries = render([buildBooking()]);

    await screen.findByText('Hotel Las Américas, 6 noches');
    await user.click(screen.getByRole('button', { name: 'Confirmadas' }));
    await waitFor(() =>
      expect(queries.some((query) => query.get('status') === 'confirmed')).toBe(
        true,
      ),
    );

    await user.click(screen.getByRole('button', { name: 'Todas' }));
    await waitFor(() =>
      expect(queries.some((query) => query.get('status') === null)).toBe(true),
    );
  });
});

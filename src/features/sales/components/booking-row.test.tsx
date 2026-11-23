import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { buildBooking } from '@/test/sales';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { BookingRow } from './booking-row';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

type Booking = ReturnType<typeof buildBooking>;

const render = (
  booking: Booking,
  permissions: string[] = ['sales.view', 'sales.manage'],
  showSale = false,
) => {
  server.use(sessionHandler(buildSession({ permissions })));
  renderWithProviders(
    <SessionGuard>
      <ul>
        <BookingRow booking={booking} showSale={showSale} />
      </ul>
    </SessionGuard>,
  );
};

describe('BookingRow', () => {
  it('muestra qué se reserva, con quién, las fechas y su estado', async () => {
    render(
      buildBooking({ confirmation_code: 'HX-2231', status: 'confirmed' }),
      ['sales.view'],
    );

    expect(
      await screen.findByText('Hotel Las Américas, 6 noches'),
    ).toBeVisible();
    expect(screen.getByText('Confirmada')).toBeVisible();
    const detail = screen.getByText(/Cantidad 3/);
    expect(detail).toHaveTextContent(
      'Hotel Las Américas (reservas@example.com)',
    );
    expect(detail).toHaveTextContent('Confirmación HX-2231');
  });

  it('sin proveedor ni fechas lo dice', async () => {
    render(buildBooking({ supplier: null, start_date: null, end_date: null }));

    const detail = await screen.findByText(/Cantidad 3/);

    expect(detail).toHaveTextContent('Sin fechas');
    expect(detail).toHaveTextContent('Proveedor por definir');
  });

  it('con una sola fecha la muestra sola, y con teléfono usa el teléfono', async () => {
    render(
      buildBooking({
        end_date: null,
        supplier: {
          id: 4,
          trade_name: 'Tour del Caribe',
          contact_email: null,
          contact_phone: '+573001234567',
        },
      }),
    );

    const detail = await screen.findByText(/Cantidad 3/);

    expect(detail).toHaveTextContent('Tour del Caribe (+573001234567)');
    expect(detail).not.toHaveTextContent('Sin fechas');
  });

  it('en la lista de todas las ventas enlaza a la venta', async () => {
    render(buildBooking(), ['sales.view'], true);

    expect(
      await screen.findByRole('link', { name: 'VEN-0003 · San Andrés' }),
    ).toHaveAttribute('href', '/ventas/3');
  });

  it('sin permiso de gestión no hay controles', async () => {
    render(buildBooking(), ['sales.view']);

    await screen.findByText('Hotel Las Américas, 6 noches');

    expect(
      screen.queryByRole('button', { name: 'Guardar' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Copiar solicitud' }),
    ).not.toBeInTheDocument();
  });

  it('guarda el estado y el código de confirmación sin espacios sobrantes', async () => {
    const user = userEvent.setup();
    let body: unknown;
    render(buildBooking());
    server.use(
      http.put(apiUrl('/api/bookings/21'), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(buildBooking({ status: 'confirmed' }));
      }),
    );

    await user.selectOptions(
      await screen.findByLabelText('Estado de Hotel Las Américas, 6 noches'),
      'Confirmada',
    );
    await user.type(
      screen.getByLabelText(
        'Código de confirmación de Hotel Las Américas, 6 noches',
      ),
      '  HX-2231 ',
    );
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await vi.waitFor(() =>
      expect(body).toEqual({
        status: 'confirmed',
        confirmation_code: 'HX-2231',
        notes: null,
      }),
    );
  });

  it('un código vacío se guarda como sin código', async () => {
    const user = userEvent.setup();
    let body: unknown;
    render(buildBooking({ confirmation_code: 'HX-1' }));
    server.use(
      http.put(apiUrl('/api/bookings/21'), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(buildBooking());
      }),
    );

    await user.clear(
      await screen.findByLabelText(
        'Código de confirmación de Hotel Las Américas, 6 noches',
      ),
    );
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await vi.waitFor(() =>
      expect(body).toMatchObject({ confirmation_code: null }),
    );
  });

  it('copia el texto de la solicitud para el proveedor', async () => {
    const user = userEvent.setup();
    render(buildBooking());

    await user.click(
      await screen.findByRole('button', { name: 'Copiar solicitud' }),
    );

    expect(
      await screen.findByRole('button', { name: 'Copiada' }),
    ).toBeVisible();
    const copied = await navigator.clipboard.readText();
    expect(copied).toContain('Hola, Hotel Las Américas.');
    expect(copied).toContain('Referencia de la agencia: VEN-0003.');
  });
});

import { describe, expect, it } from 'vitest';

import type { Booking } from './booking-api';
import { bookingRequestText } from './booking-request';

const booking: Booking = {
  id: 1,
  sale: { id: 3, code: 'VEN-0003', destination: 'San Andrés' },
  supplier: {
    id: 9,
    trade_name: 'Hotel Demostración',
    contact_email: 'reservas@example.com',
    contact_phone: null,
  },
  service_type: 'lodging',
  name: 'Habitación familiar',
  details: 'Con desayuno.',
  start_date: '2026-12-18',
  end_date: '2026-12-24',
  quantity: 6,
  status: 'to_request',
  confirmation_code: null,
  notes: null,
};

describe('bookingRequestText', () => {
  it('arma la solicitud para el proveedor con la referencia de la venta', () => {
    const text = bookingRequestText(booking);

    expect(text).toContain('Hola, Hotel Demostración.');
    expect(text).toContain('Habitación familiar');
    expect(text).toContain('Cantidad: 6');
    expect(text).toContain('Detalle: Con desayuno.');
    expect(text).toContain('VEN-0003');
  });

  it('sin proveedor ni fechas no se inventa nada', () => {
    const text = bookingRequestText({
      ...booking,
      supplier: null,
      start_date: null,
      end_date: null,
    });

    expect(text.startsWith('Hola.')).toBe(true);
    expect(text).toContain('fechas por confirmar');
  });
});

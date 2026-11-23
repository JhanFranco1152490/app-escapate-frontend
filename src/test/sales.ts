import type { components } from '@/lib/api/schema';

type SaleListItem = components['schemas']['SaleListItem'];
type Booking = components['schemas']['BookingOut'];

export function buildSaleListItem(
  overrides: Partial<SaleListItem> = {},
): SaleListItem {
  return {
    id: 3,
    code: 'VEN-0003',
    quote: { id: 12, code: 'COT-0012' },
    client: { id: 7, display_name: 'Marcela Gómez Ortiz' },
    destination: 'San Andrés',
    departure_date: '2026-12-18',
    return_date: '2026-12-24',
    total_price: 3_000_000,
    paid: 500_000,
    balance: 2_500_000,
    payment_status: 'partial',
    created_at: '2026-11-20T15:00:00Z',
    ...overrides,
  };
}

// Una reserva por solicitar de un hotel, con su proveedor.
export function buildBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 21,
    sale: { id: 3, code: 'VEN-0003', destination: 'San Andrés' },
    supplier: {
      id: 4,
      trade_name: 'Hotel Las Américas',
      contact_email: 'reservas@example.com',
      contact_phone: null,
    },
    service_type: 'lodging',
    name: 'Hotel Las Américas, 6 noches',
    details: 'Habitación doble con desayuno.',
    start_date: '2026-12-18',
    end_date: '2026-12-24',
    quantity: 3,
    status: 'to_request',
    confirmation_code: null,
    notes: null,
    ...overrides,
  };
}

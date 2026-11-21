import type { components } from '@/lib/api/schema';

type Schemas = components['schemas'];
type QuoteListItem = Schemas['QuoteListItem'];
type QuoteDetail = Schemas['QuoteDetail'];
type QuoteItem = Schemas['QuoteItemOut'];

// Datos inventados: ningún dato personal real en las pruebas. Por defecto, un borrador recién
// creado desde la solicitud SOL-0231.
export function buildQuoteListItem(
  overrides: Partial<QuoteListItem> = {},
): QuoteListItem {
  return {
    id: 12,
    code: 'COT-0012',
    revision: 1,
    previous_quote_id: null,
    status: 'draft',
    is_expired: false,
    client: { id: 7, display_name: 'Marcela Gómez Ortiz' },
    travel_request: { id: 231, code: 'SOL-0231' },
    destination: 'San Andrés',
    departure_date: '2026-12-18',
    return_date: '2026-12-24',
    valid_until: '2026-11-27',
    created_by: { id: 2, full_name: 'Andrés Peña' },
    created_at: '2026-11-20T15:00:00Z',
    updated_at: '2026-11-20T15:00:00Z',
    ...overrides,
  };
}

export function buildQuoteItem(overrides: Partial<QuoteItem> = {}): QuoteItem {
  return {
    id: 40,
    service_type: 'lodging',
    tourist_service: null,
    supplier: null,
    name: 'Hotel Las Américas',
    details: 'Habitación doble con desayuno.',
    start_date: '2026-12-18',
    end_date: '2026-12-24',
    quantity: 6,
    charge_unit: 'per_night',
    is_optional: false,
    alternative_of_id: null,
    quality_level: null,
    currency: 'COP',
    unit_cost: '450000',
    markup_percent: '15.00',
    sale_price_override: null,
    supplier_commission_percent: null,
    cost_in_pesos: 2_700_000,
    sale_price: 3_105_000,
    version: 1,
    ...overrides,
  };
}

export function buildQuoteDetail(
  overrides: Partial<QuoteDetail> = {},
): QuoteDetail {
  return {
    ...buildQuoteListItem(),
    origin: 'Cúcuta',
    adults: 2,
    minors: 1,
    notes: null,
    default_markup_percent: '15.00',
    exchange_rate: null,
    deposit_percent: null,
    balance_due_date: null,
    payment_terms: null,
    policies: null,
    sent_at: null,
    decided_at: null,
    version: 1,
    items: [],
    totals: {
      cost: 0,
      sale: 0,
      profit: 0,
      margin_percent: null,
      optional_sale: 0,
      per_person: null,
      deposit: null,
      missing_exchange_rate: false,
    },
    ...overrides,
  };
}

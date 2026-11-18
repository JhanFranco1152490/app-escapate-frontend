import type { components } from '@/lib/api/schema';

type Schemas = components['schemas'];
type TravelRequestListItem = Schemas['TravelRequestListItem'];
type TravelRequestDetail = Schemas['TravelRequestDetail'];
type TravelRequestSummary = Schemas['TravelRequestSummary'];
type AdvisorOption = Schemas['AdvisorOption'];

const ADVISOR = { id: 2, full_name: 'Andrés Peña', is_active: true };
const CLIENT = { id: 7, display_name: 'Marcela Gómez Ortiz' };

// Datos inventados: ningún dato personal real en las pruebas. Por defecto, una solicitud con
// fechas exactas, recién registrada.
export function buildTravelRequestListItem(
  overrides: Partial<TravelRequestListItem> = {},
): TravelRequestListItem {
  return {
    id: 231,
    code: 'SOL-0231',
    client: CLIENT,
    destination: 'San Andrés',
    date_mode: 'exact',
    departure_date: '2026-12-18',
    return_date: '2026-12-24',
    window_start: null,
    window_end: null,
    approx_nights: null,
    adults: 2,
    minors: 1,
    status: 'new',
    assigned_to: ADVISOR,
    created_at: '2026-11-10T15:00:00Z',
    updated_at: '2026-11-12T15:00:00Z',
    waiting_days: 3,
    ...overrides,
  };
}

export function buildTravelRequestDetail(
  overrides: Partial<TravelRequestDetail> = {},
): TravelRequestDetail {
  return {
    ...buildTravelRequestListItem(),
    origin: 'Cúcuta',
    budget_min: 6_000_000,
    budget_max: 8_000_000,
    trip_types: ['family', 'leisure'],
    accommodation_category: 'four_star',
    notes: 'Prefieren hotel cerca de la playa.\nViajan con un coche de bebé.',
    close_reason: null,
    close_note: null,
    closed_by: null,
    closed_at: null,
    created_by: { id: ADVISOR.id, full_name: ADVISOR.full_name },
    version: 1,
    ...overrides,
  };
}

// Un período flexible en lugar de fechas exactas.
export const buildFlexibleRequestDetail = (
  overrides: Partial<TravelRequestDetail> = {},
) =>
  buildTravelRequestDetail({
    date_mode: 'flexible',
    departure_date: null,
    return_date: null,
    window_start: '2026-12-01',
    window_end: '2026-12-31',
    approx_nights: 5,
    ...overrides,
  });

export const buildClosedRequestDetail = (
  overrides: Partial<TravelRequestDetail> = {},
) =>
  buildTravelRequestDetail({
    status: 'closed',
    close_reason: 'bought_elsewhere',
    close_note: 'Encontró un plan más barato.',
    closed_by: { id: ADVISOR.id, full_name: ADVISOR.full_name },
    closed_at: '2026-11-12T20:00:00Z',
    version: 2,
    ...overrides,
  });

export function buildTravelRequestSummary(
  overrides: Partial<TravelRequestSummary> = {},
): TravelRequestSummary {
  return {
    by_status: { new: 4, quoting: 2, quoted: 3, closed: 1 },
    total: 10,
    pending: 6,
    pending_over_3_days: 2,
    ...overrides,
  };
}

export const buildAdvisor = (
  overrides: Partial<AdvisorOption> = {},
): AdvisorOption => ({
  id: ADVISOR.id,
  full_name: ADVISOR.full_name,
  ...overrides,
});

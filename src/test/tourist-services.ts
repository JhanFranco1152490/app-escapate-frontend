import type { components } from '@/lib/api/schema';

type TouristServiceDetail = components['schemas']['TouristServiceDetail'];
type TouristServiceListItem = components['schemas']['TouristServiceListItem'];
type ServiceRate = components['schemas']['ServiceRate'];

const MANAGER = { id: 3, full_name: 'Sofía Barrios' };

// Datos inventados: ningún dato personal real en las pruebas. Por defecto, un alojamiento del
// proveedor de `buildSupplierDetail`.
export function buildServiceDetail(
  overrides: Partial<TouristServiceDetail> = {},
): TouristServiceDetail {
  return {
    id: 60,
    service_type: 'lodging',
    name: 'Habitación familiar conectada',
    destination: 'Cartagena',
    is_active: true,
    current_rate_count: 2,
    supplier: { id: 40, trade_name: 'Hotel Costa Azul', is_active: true },
    description: null,
    conditions: 'Cancelación sin costo hasta 30 días antes.',
    attributes: {
      lodging_kind: 'hotel',
      stars: 4,
      meal_plan: 'breakfast',
      max_capacity: 4,
      check_in_time: '15:00',
      check_out_time: '12:00',
      includes: ['airport_transfers', 'wifi'],
    },
    deactivated_at: null,
    deactivated_by: null,
    created_by: MANAGER,
    created_at: '2026-11-08T15:00:00Z',
    updated_at: '2026-11-08T15:00:00Z',
    version: 1,
    ...overrides,
  };
}

export function buildServiceListItem(
  overrides: Partial<TouristServiceListItem> = {},
): TouristServiceListItem {
  const { id, service_type, name, destination, is_active, current_rate_count } =
    buildServiceDetail();
  return {
    id,
    service_type,
    name,
    destination,
    is_active,
    current_rate_count,
    ...overrides,
  };
}

// Por defecto, una tarifa en pesos vigente y sin fecha de fin.
export function buildServiceRate(
  overrides: Partial<ServiceRate> = {},
): ServiceRate {
  return {
    id: 80,
    name: 'Temporada alta',
    valid_from: '2026-11-01',
    valid_until: null,
    currency: 'COP',
    charge_unit: 'per_night',
    amount: '710000',
    conditions: 'Hasta 4 personas por habitación.',
    validity_status: 'current',
    created_by: MANAGER,
    created_at: '2026-11-08T15:00:00Z',
    updated_at: '2026-11-08T15:00:00Z',
    version: 1,
    ...overrides,
  };
}

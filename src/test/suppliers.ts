import type { components } from '@/lib/api/schema';

type SupplierDetail = components['schemas']['SupplierDetail'];
type SupplierListItem = components['schemas']['SupplierListItem'];

const MANAGER = { id: 3, full_name: 'Sofía Barrios' };

// Datos inventados: ningún dato personal real en las pruebas.
export function buildSupplierDetail(
  overrides: Partial<SupplierDetail> = {},
): SupplierDetail {
  return {
    id: 40,
    trade_name: 'Hotel Costa Azul',
    legal_name: 'Costa Azul S.A.S.',
    document_type: 'NIT',
    document_number: '8001112227',
    categories: ['lodging', 'tours'],
    city: 'Cartagena',
    contact_name: 'Mónica Salas',
    contact_email: 'ventas@example.com',
    contact_phone: '+573001112233',
    is_active: true,
    coverage_zone: 'Caribe colombiano',
    contact_role: 'Ventas a agencias',
    payment_terms: '50 % al reservar, saldo 15 días antes',
    commission_rate: '10.00',
    agreement_valid_until: '2027-06-30',
    agreement_expired: false,
    notes: null,
    deactivated_at: null,
    deactivated_by: null,
    created_by: MANAGER,
    created_at: '2026-10-28T15:00:00Z',
    updated_at: '2026-10-28T15:00:00Z',
    version: 1,
    ...overrides,
  };
}

export function buildSupplierListItem(
  overrides: Partial<SupplierListItem> = {},
): SupplierListItem {
  const {
    id,
    trade_name,
    legal_name,
    document_type,
    document_number,
    categories,
    city,
    contact_name,
    contact_email,
    contact_phone,
    is_active,
  } = buildSupplierDetail();
  return {
    id,
    trade_name,
    legal_name,
    document_type,
    document_number,
    categories,
    city,
    contact_name,
    contact_email,
    contact_phone,
    is_active,
    ...overrides,
  };
}

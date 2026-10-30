import type { components } from '@/lib/api/schema';

type ClientDetail = components['schemas']['ClientDetail'];
type ClientListItem = components['schemas']['ClientListItem'];
type TravelerDetail = components['schemas']['TravelerDetail'];
type TravelerListItem = components['schemas']['TravelerListItem'];

type Page<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

const ADVISOR = { id: 2, full_name: 'Andrés Peña' };

// Datos inventados: ningún dato personal real en las pruebas.
export function buildClientDetail(
  overrides: Partial<ClientDetail> = {},
): ClientDetail {
  return {
    id: 12,
    client_type: 'person',
    display_name: 'Marcela Gómez Ortiz',
    first_name: 'Marcela',
    last_name: 'Gómez Ortiz',
    business_name: null,
    document_type: 'CC',
    document_number: '1020304050',
    birth_date: '1988-04-15',
    phone: '+573001112233',
    email: 'marcela.gomez@example.com',
    city: 'Cúcuta',
    contact_source: 'whatsapp',
    contact_source_detail: null,
    notes: null,
    data_consent_at: '2026-10-20T15:00:00Z',
    data_consent_by: ADVISOR,
    created_by: ADVISOR,
    created_at: '2026-10-20T15:00:00Z',
    updated_at: '2026-10-20T15:00:00Z',
    version: 1,
    ...overrides,
  };
}

export const buildCompanyDetail = (overrides: Partial<ClientDetail> = {}) =>
  buildClientDetail({
    id: 13,
    client_type: 'company',
    display_name: 'Viajes Andinos S.A.S.',
    first_name: null,
    last_name: null,
    business_name: 'Viajes Andinos S.A.S.',
    document_type: 'NIT',
    document_number: '9001234568',
    birth_date: null,
    email: 'contacto@example.com',
    ...overrides,
  });

export function buildClientListItem(
  overrides: Partial<ClientListItem> = {},
): ClientListItem {
  const {
    id,
    client_type,
    display_name,
    email,
    phone,
    document_type,
    document_number,
    city,
  } = buildClientDetail();
  return {
    id,
    client_type,
    display_name,
    email,
    phone,
    document_type,
    document_number,
    city,
    ...overrides,
  };
}

export function buildTravelerDetail(
  overrides: Partial<TravelerDetail> = {},
): TravelerDetail {
  return {
    id: 30,
    first_name: 'Sofía',
    last_name: 'Gómez Ruiz',
    full_name: 'Sofía Gómez Ruiz',
    document_type: 'TI',
    document_number: '1090123456',
    birth_date: '2014-03-12',
    age: 12,
    is_minor: true,
    nationality: 'CO',
    reference_client: { id: 12, display_name: 'Marcela Gómez Ortiz' },
    is_the_client: false,
    notes: null,
    data_consent_at: '2026-10-21T15:00:00Z',
    data_consent_by: ADVISOR,
    created_by: ADVISOR,
    created_at: '2026-10-21T15:00:00Z',
    updated_at: '2026-10-21T15:00:00Z',
    version: 1,
    ...overrides,
  };
}

// La ficha de viajero del propio cliente persona de `buildClientDetail`.
export const buildClientAsTraveler = (
  overrides: Partial<TravelerDetail> = {},
) =>
  buildTravelerDetail({
    id: 31,
    first_name: 'Marcela',
    last_name: 'Gómez Ortiz',
    full_name: 'Marcela Gómez Ortiz',
    document_type: 'CC',
    document_number: '1020304050',
    birth_date: '1988-04-15',
    age: 38,
    is_minor: false,
    is_the_client: true,
    ...overrides,
  });

export function buildTravelerListItem(
  overrides: Partial<TravelerListItem> = {},
): TravelerListItem {
  const {
    id,
    first_name,
    last_name,
    full_name,
    document_type,
    document_number,
    birth_date,
    age,
    is_minor,
    nationality,
    reference_client,
    is_the_client,
  } = buildTravelerDetail();
  return {
    id,
    first_name,
    last_name,
    full_name,
    document_type,
    document_number,
    birth_date,
    age,
    is_minor,
    nationality,
    reference_client,
    is_the_client,
    ...overrides,
  };
}

export function buildPage<T>(
  results: T[],
  overrides: Partial<Page<T>> = {},
): Page<T> {
  return {
    count: results.length,
    next: null,
    previous: null,
    results,
    ...overrides,
  };
}

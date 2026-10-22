import type { components } from '@/lib/api/schema';

type UserDetail = components['schemas']['UserDetail'];
type UserListItem = components['schemas']['UserListItem'];
type UserPage = components['schemas']['Page_UserListItem_'];

// Datos inventados: ningún dato personal real en las pruebas.
export function buildUserDetail(
  overrides: Partial<UserDetail> = {},
): UserDetail {
  return {
    id: 7,
    first_name: 'Laura',
    last_name: 'Rojas',
    full_name: 'Laura Rojas',
    email: 'laura.rojas@example.com',
    role: { id: 2, name: 'Asesor comercial' },
    is_active: true,
    invitation_pending: false,
    last_activity_at: '2026-10-05T20:30:00Z',
    document_type: 'CC',
    document_number: '1090123456',
    phone: '3001234567',
    has_password: true,
    google_linked: false,
    created_at: '2026-10-01T15:00:00Z',
    updated_at: '2026-10-01T15:00:00Z',
    ...overrides,
  };
}

export function buildUserListItem(
  overrides: Partial<UserListItem> = {},
): UserListItem {
  const {
    id,
    first_name,
    last_name,
    full_name,
    email,
    role,
    is_active,
    invitation_pending,
    last_activity_at,
  } = buildUserDetail();
  return {
    id,
    first_name,
    last_name,
    full_name,
    email,
    role,
    is_active,
    invitation_pending,
    last_activity_at,
    ...overrides,
  };
}

export function buildUserPage(
  results: UserListItem[] = [buildUserListItem()],
  overrides: Partial<UserPage> = {},
): UserPage {
  return {
    count: results.length,
    next: null,
    previous: null,
    results,
    ...overrides,
  };
}

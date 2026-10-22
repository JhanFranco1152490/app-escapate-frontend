import type { components } from '@/lib/api/schema';

type RoleListItem = components['schemas']['RoleListItem'];
type RoleDetail = components['schemas']['RoleDetail'];
type PermissionItem = components['schemas']['PermissionItem'];

const ADMIN_HELP = 'Dalo solo a quien le confiarías el rol Administrador.';

// El catálogo tal como lo registra el backend, en su orden.
export const PERMISSION_CATALOG: PermissionItem[] = [
  {
    code: 'users.view',
    section: 'Administración',
    group: 'Usuarios',
    label: 'Ver',
    description: 'Ver usuarios',
    requires: [],
    help: null,
  },
  {
    code: 'users.manage',
    section: 'Administración',
    group: 'Usuarios',
    label: 'Gestionar',
    description: 'Gestionar usuarios',
    requires: ['users.view'],
    help: `Permite crear administradores y cambiar el rol de cualquier persona. ${ADMIN_HELP}`,
  },
  {
    code: 'roles.view',
    section: 'Administración',
    group: 'Roles y permisos',
    label: 'Ver',
    description: 'Ver roles y permisos',
    requires: [],
    help: null,
  },
  {
    code: 'roles.manage',
    section: 'Administración',
    group: 'Roles y permisos',
    label: 'Gestionar',
    description: 'Gestionar roles y permisos',
    requires: ['roles.view'],
    help: `Permite dar cualquier permiso a cualquier rol. ${ADMIN_HELP}`,
  },
];

export function buildRoleListItem(
  overrides: Partial<RoleListItem> = {},
): RoleListItem {
  return {
    id: 2,
    name: 'Asesor comercial',
    description: 'Clientes, viajeros, solicitudes y borradores.',
    is_protected: false,
    user_count: 5,
    inactive_user_count: 1,
    ...overrides,
  };
}

export function buildRoleDetail(
  overrides: Partial<RoleDetail> = {},
): RoleDetail {
  return {
    ...buildRoleListItem(),
    permissions: ['users.view'],
    created_at: '2026-10-01T15:00:00Z',
    updated_at: '2026-10-01T15:00:00Z',
    ...overrides,
  };
}

// Los cuatro roles sembrados, como los devuelve GET /api/roles (ordenados por nombre).
export const ROLES: RoleListItem[] = [
  buildRoleListItem({
    id: 1,
    name: 'Administrador',
    description:
      'Acceso a todo el panel, incluida la gestión de usuarios y permisos.',
    is_protected: true,
    user_count: 1,
    inactive_user_count: 0,
  }),
  buildRoleListItem(),
  buildRoleListItem({
    id: 3,
    name: 'Encargado de proveedores',
    description: 'Proveedores, servicios y tarifas.',
    user_count: 2,
    inactive_user_count: 0,
  }),
  buildRoleListItem({
    id: 4,
    name: 'Operativo',
    description: 'Reservas, documentos y pagos posteriores a la venta.',
    user_count: 0,
    inactive_user_count: 0,
  }),
];

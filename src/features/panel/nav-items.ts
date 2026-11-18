import {
  Building2,
  ClipboardList,
  Contact,
  Hourglass,
  House,
  Luggage,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';

import type { SessionUser } from '@/features/auth/api';
import { hasPermission } from '@/features/auth/permissions';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  group: string;
  // Sin permiso, la entrada la ve cualquier persona con sesión.
  permission?: string;
};

export type NavGroup = { label: string; items: NavItem[] };

// Cada módulo nuevo agrega aquí su entrada. El orden de la lista es el del menú.
export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Inicio', icon: House, group: 'Operación' },
  {
    href: '/clientes',
    label: 'Clientes',
    icon: Contact,
    group: 'Operación',
    permission: 'clients.view',
  },
  {
    href: '/viajeros',
    label: 'Viajeros',
    icon: Luggage,
    group: 'Operación',
    permission: 'travelers.view',
  },
  {
    href: '/solicitudes',
    label: 'Solicitudes',
    icon: ClipboardList,
    group: 'Operación',
    permission: 'travel_requests.view',
  },
  {
    href: '/por-cotizar',
    label: 'Por cotizar',
    icon: Hourglass,
    group: 'Operación',
    permission: 'travel_requests.view',
  },
  {
    href: '/proveedores',
    label: 'Proveedores',
    icon: Building2,
    group: 'Oferta turística',
    permission: 'suppliers.view',
  },
  {
    href: '/usuarios',
    label: 'Usuarios',
    icon: Users,
    group: 'Administración',
    permission: 'users.view',
  },
  {
    href: '/roles',
    label: 'Roles y permisos',
    icon: ShieldCheck,
    group: 'Administración',
    permission: 'roles.view',
  },
];

// Una entrada queda marcada también en sus subrutas (la ficha de un usuario marca
// "Usuarios"), salvo la raíz, que coincidiría con todo.
export function isNavItemActive(item: NavItem, pathname: string) {
  if (item.href === '/') return pathname === '/';
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

// Solo las entradas permitidas, agrupadas en el orden de la lista; un grupo sin entradas
// no aparece.
export function visibleNavGroups(session: SessionUser): NavGroup[] {
  const groups: NavGroup[] = [];
  for (const item of NAV_ITEMS) {
    if (item.permission && !hasPermission(session, item.permission)) continue;
    const group = groups.find((existing) => existing.label === item.group);
    if (group) group.items.push(item);
    else groups.push({ label: item.group, items: [item] });
  }
  return groups;
}

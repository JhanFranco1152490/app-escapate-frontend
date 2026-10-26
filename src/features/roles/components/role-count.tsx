'use client';

import Link from 'next/link';

import { useHasPermission } from '@/features/auth/permissions';

import type { RoleListItem } from '../api';

const plural = (count: number, singular: string, many: string) =>
  `${count} ${count === 1 ? singular : many}`;

// Cuenta a todas las personas con el rol, también las inactivas: conservan el rol para cuando
// se las reactive, y por eso el rol no se puede borrar.
export function roleCountText(total: number, inactive: number) {
  if (total === 0) return 'Sin usuarios';
  const people = plural(total, 'usuario', 'usuarios');
  return inactive > 0
    ? `${people} · ${plural(inactive, 'inactivo', 'inactivos')}`
    : people;
}

type RoleCountProps = {
  role: Pick<RoleListItem, 'id' | 'user_count' | 'inactive_user_count'>;
};

// Con permiso para ver usuarios, el conteo lleva a la lista filtrada por el rol.
export function RoleCount({ role }: RoleCountProps) {
  const canViewUsers = useHasPermission('users.view');
  const text = roleCountText(role.user_count, role.inactive_user_count);
  const className =
    'font-mono text-[0.625rem] tracking-[0.08em] text-muted-foreground';

  if (!canViewUsers || role.user_count === 0)
    return <span className={className}>{text}</span>;
  return (
    <Link
      href={`/usuarios?role_id=${role.id}`}
      className={`${className} underline-offset-4 hover:text-foreground hover:underline`}
    >
      {text}
    </Link>
  );
}

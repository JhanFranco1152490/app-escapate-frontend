import { cn } from 'cn';

import type { UserListItem } from '../api';

type Status = 'active' | 'pending' | 'inactive';

const STATUS: Record<Status, { label: string; dot: string; text: string }> = {
  active: {
    label: 'Activo',
    dot: 'bg-[rgb(var(--ok))]',
    text: 'text-[rgb(var(--ok))]',
  },
  pending: {
    label: 'Invitación pendiente',
    dot: 'bg-orange-500',
    text: 'text-foreground',
  },
  inactive: {
    label: 'Inactivo',
    dot: 'border border-muted-foreground',
    text: 'text-muted-foreground',
  },
};

// "Invitación pendiente" es una cuenta activa que todavía no ha entrado nunca (sin
// contraseña y sin Google vinculado).
export function userStatus(
  user: Pick<UserListItem, 'is_active' | 'invitation_pending'>,
): Status {
  if (!user.is_active) return 'inactive';
  return user.invitation_pending ? 'pending' : 'active';
}

// El color acompaña a la etiqueta, nunca la reemplaza.
export function UserStatusBadge({
  user,
}: {
  user: Pick<UserListItem, 'is_active' | 'invitation_pending'>;
}) {
  const { label, dot, text } = STATUS[userStatus(user)];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-[0.625rem] tracking-[0.12em] uppercase',
        text,
      )}
    >
      <span aria-hidden="true" className={cn('size-1.75 rounded-full', dot)} />
      {label}
    </span>
  );
}

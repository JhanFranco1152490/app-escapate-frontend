import { StatusBadge, type StatusTone } from '@/components/status-badge';

import type { UserListItem } from '../api';

type Status = 'active' | 'pending' | 'inactive';

const STATUS: Record<Status, { label: string; tone: StatusTone }> = {
  active: { label: 'Activo', tone: 'ok' },
  pending: { label: 'Invitación pendiente', tone: 'pending' },
  inactive: { label: 'Inactivo', tone: 'inactive' },
};

// "Invitación pendiente" es una cuenta activa que todavía no ha entrado nunca (sin
// contraseña y sin Google vinculado).
export function userStatus(
  user: Pick<UserListItem, 'is_active' | 'invitation_pending'>,
): Status {
  if (!user.is_active) return 'inactive';
  return user.invitation_pending ? 'pending' : 'active';
}

export function UserStatusBadge({
  user,
}: {
  user: Pick<UserListItem, 'is_active' | 'invitation_pending'>;
}) {
  return <StatusBadge {...STATUS[userStatus(user)]} />;
}

'use client';

import Link from 'next/link';

import { useCurrentUser } from '@/features/auth/components/session-guard';
import { useHasPermission } from '@/features/auth/permissions';

// Nadie cambia su propio rol: la API lo rechaza, así que en la propia ficha no se ofrece.
// Es un enlace en línea junto al nombre del rol: el relleno vertical agranda el área para
// tocarlo sin empujar la fila, así el rol queda alineado con los demás datos.
export function ChangeRoleLink({ userId }: { userId: number }) {
  const canManage = useHasPermission('users.manage');
  const currentUser = useCurrentUser();
  if (!canManage || userId === currentUser.id) return null;

  return (
    <Link
      href={`/usuarios/${userId}/rol`}
      className="ml-3 py-3 text-[0.78125rem] text-orange-600 underline-offset-4 hover:underline"
    >
      Cambiar rol
    </Link>
  );
}

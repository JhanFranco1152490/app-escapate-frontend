'use client';

import { Alert } from '@/components/alert';

import { useRoleNotice } from '../use-role-notice';
import { RolePlaceholder } from './role-placeholder';

// /roles sin un rol abierto: el aviso de la última acción (por ejemplo, "Rol borrado.") y, en
// escritorio, la invitación a elegir un rol.
export function RolesIndex() {
  const notice = useRoleNotice('list');
  return (
    <div className="flex flex-col gap-4">
      {notice && <Alert variant="info" title={notice} />}
      <RolePlaceholder />
    </div>
  );
}

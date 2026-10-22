'use client';

import { useState } from 'react';

import { Alert } from '@/components/alert';
import { useHasPermission } from '@/features/auth/permissions';
import { parseRouteId } from '@/lib/route-id';

import { useUpdateRole, type PermissionItem, type RoleDetail } from '../api';
import type { RoleFormValues, RoleValues } from '../schemas';
import { useRoleNotice } from '../use-role-notice';
import { DeleteRoleButton } from './delete-role-button';
import { RoleForm, type RoleFormLock } from './role-form';
import { RoleLoader } from './role-loader';

const PROTECTED_NOTE =
  'El rol Administrador siempre tiene todos los permisos. Solo se puede cambiar su descripción.';

function peopleNote(count: number) {
  const changes =
    'Los cambios se aplican desde su siguiente acción en el panel.';
  if (count === 0) return 'Nadie tiene este rol todavía.';
  return count === 1
    ? `1 usuario tiene este rol. ${changes}`
    : `${count} usuarios tienen este rol. ${changes}`;
}

const toFormValues = (role: RoleDetail): RoleFormValues => ({
  name: role.name,
  description: role.description ?? '',
  permissions: role.permissions,
});

export function RoleScreen({ id }: { id: string }) {
  const roleId = parseRouteId(id);
  return (
    <RoleLoader roleId={roleId}>
      {(role, catalog) => (
        // Al abrir otro rol desde la lista, el formulario empieza de cero con el nuevo.
        <RoleView key={role.id} role={role} catalog={catalog} />
      )}
    </RoleLoader>
  );
}

function RoleView({
  role,
  catalog,
}: {
  role: RoleDetail;
  catalog: PermissionItem[];
}) {
  const canManage = useHasPermission('roles.manage');
  const updateRole = useUpdateRole(role.id);
  const createdNotice = useRoleNotice(role.id);
  const [savedNotice, setSavedNotice] = useState<string>();
  // Los valores del formulario se fijan al montar: una nueva lectura del rol no pisa lo que
  // se está escribiendo.
  const [defaultValues] = useState(() => toFormValues(role));
  const lock: RoleFormLock = !canManage
    ? 'all'
    : role.is_protected
      ? 'protected'
      : 'none';

  const submit = async (values: RoleValues) => {
    setSavedNotice(undefined);
    // Del rol protegido solo cambia la descripción: el nombre y los permisos se envían tal
    // como están guardados.
    const body = role.is_protected
      ? { ...values, name: role.name, permissions: role.permissions }
      : values;
    await updateRole.mutateAsync(body);
    setSavedNotice('Cambios guardados.');
  };

  const notice = savedNotice ?? createdNotice;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <h2 className="font-heading text-[1.4375rem] leading-tight font-semibold break-words">
          {role.name}
        </h2>
        <p className="text-[0.84375rem] text-muted-foreground">
          {peopleNote(role.user_count)}
        </p>
      </header>
      {notice && <Alert variant="info" title={notice} />}
      {role.is_protected && <Alert variant="info" title={PROTECTED_NOTE} />}
      <RoleForm
        catalog={catalog}
        defaultValues={defaultValues}
        submitLabel="Guardar cambios"
        lock={lock}
        onSubmit={submit}
      />
      {canManage && !role.is_protected && <DeleteRoleButton role={role} />}
    </div>
  );
}

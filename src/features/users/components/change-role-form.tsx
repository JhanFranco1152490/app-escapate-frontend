'use client';

import { RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Alert } from '@/components/alert';
import { ButtonLink } from '@/components/button-link';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/features/auth/components/session-guard';
import { useRoles } from '@/features/roles/api';
import { RoleGrants } from '@/features/roles/components/role-grants';
import { getErrorMessage, isApiError } from '@/lib/api/errors';

import { useChangeUserRole, type UserDetail } from '../api';
import { setSavedNotice } from '../saved-notice';
import { RoleOption } from './role-option';
import { UserStatusBadge } from './user-status-badge';

const SAVE_ERROR = 'No pudimos cambiar el rol. Inténtalo de nuevo.';
const CHANGE_NOTE =
  'El cambio aplica desde su siguiente acción en el panel. No podrá abrir lo que su nuevo rol no permita.';

// El motivo del rechazo: el del campo si el rol ya no existe, o el que da la API.
function errorText(error: unknown) {
  const roleError = isApiError(error) ? error.fields.role_id?.[0] : undefined;
  return roleError ?? getErrorMessage(error, SAVE_ERROR);
}

export function ChangeRoleForm({ user }: { user: UserDetail }) {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const isSelf = user.id === currentUser.id;
  const roles = useRoles();
  const changeRole = useChangeUserRole(user.id);
  const [selectedId, setSelectedId] = useState(user.role.id);
  const [confirming, setConfirming] = useState(false);
  const selected = roles.data?.find((role) => role.id === selectedId);
  const backHref = `/usuarios/${user.id}`;

  // Nadie cambia su propio rol: si se llega por la URL, se vuelve a la ficha.
  useEffect(() => {
    if (isSelf) router.replace(backHref);
  }, [isSelf, router, backHref]);
  if (isSelf) return null;

  const save = () =>
    changeRole.mutate(selectedId, {
      onSuccess: () => {
        setSavedNotice({ userId: user.id, kind: 'role', invitationSent: null });
        router.push(backHref);
      },
    });

  // Hacer a alguien Administrador es el cambio que más acceso da: se confirma antes.
  const submit = () => {
    if (selected?.is_protected) {
      changeRole.reset();
      setConfirming(true);
    } else save();
  };

  const error = changeRole.isError ? errorText(changeRole.error) : undefined;

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-1.5 rounded-md border bg-card px-5 py-4">
        <h2 className="font-heading text-lg font-semibold">{user.full_name}</h2>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.84375rem] text-muted-foreground">
          {user.email}
          <UserStatusBadge user={user} />
        </p>
      </section>
      {error && !confirming && <Alert title={error} />}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <fieldset className="overflow-hidden rounded-md border bg-card">
          <legend className="sr-only">Rol del usuario</legend>
          {roles.isError ? (
            <div className="flex flex-col items-start gap-3 p-5 text-[0.84375rem]">
              <p className="text-muted-foreground">
                No pudimos cargar los roles.
              </p>
              <Button variant="outline" onClick={() => void roles.refetch()}>
                <RotateCcw aria-hidden="true" />
                Reintentar
              </Button>
            </div>
          ) : roles.data ? (
            roles.data.map((role) => (
              <RoleOption
                key={role.id}
                role={role}
                current={role.id === user.role.id}
                checked={role.id === selectedId}
                onSelect={() => setSelectedId(role.id)}
              />
            ))
          ) : (
            <div role="status" aria-label="Cargando roles" className="p-5">
              <Skeleton className="h-24 w-full" />
            </div>
          )}
        </fieldset>
        <section
          aria-label="Qué podrá hacer"
          className="flex flex-col gap-3 rounded-md border bg-card px-5 py-4"
        >
          <h3 className="font-heading text-base font-semibold">
            Qué podrá hacer
          </h3>
          <RoleGrants roleId={selectedId} />
          <p className="text-[0.78125rem] leading-normal text-muted-foreground">
            {CHANGE_NOTE}
          </p>
        </section>
      </div>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <ButtonLink href={backHref} variant="outline">
          Cancelar
        </ButtonLink>
        <Button
          disabled={selectedId === user.role.id || changeRole.isPending}
          onClick={submit}
        >
          {changeRole.isPending && !confirming ? 'Guardando…' : 'Guardar rol'}
        </Button>
      </div>
      {selected?.is_protected && (
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          title={`¿Hacer ${selected.name} a ${user.full_name}?`}
          description="Tendrá acceso a todo el panel, incluida la gestión de usuarios y de roles."
          confirmLabel={`Hacer ${selected.name}`}
          pending={changeRole.isPending}
          error={error}
          onConfirm={save}
        />
      )}
    </div>
  );
}

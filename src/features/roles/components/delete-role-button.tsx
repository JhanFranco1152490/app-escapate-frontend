'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/api/errors';

import { useDeleteRole, type RoleDetail } from '../api';
import { setRoleNotice } from '../role-notice';

const DELETE_ERROR = 'No pudimos borrar el rol. Inténtalo de nuevo.';

export function DeleteRoleButton({ role }: { role: RoleDetail }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const deleteRole = useDeleteRole(role.id);

  // Las personas inactivas también cuentan: conservan el rol para cuando se las reactive.
  if (role.user_count > 0)
    return (
      <p className="text-[0.78125rem] text-muted-foreground">
        Para borrar este rol, primero cambia el rol de las personas que lo
        tienen.
      </p>
    );

  const confirm = () =>
    deleteRole.mutate(undefined, {
      onSuccess: () => {
        setRoleNotice({ target: 'list', text: 'Rol borrado.' });
        router.push('/roles');
      },
    });

  return (
    <>
      <Button
        variant="destructive"
        className="w-fit"
        onClick={() => {
          // Un error de un intento anterior no se arrastra a uno nuevo.
          deleteRole.reset();
          setOpen(true);
        }}
      >
        Borrar rol
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`¿Borrar el rol ${role.name}?`}
        description="Esta acción no se puede deshacer."
        confirmLabel="Borrar rol"
        pending={deleteRole.isPending}
        error={
          deleteRole.isError
            ? getErrorMessage(deleteRole.error, DELETE_ERROR)
            : undefined
        }
        onConfirm={confirm}
      />
    </>
  );
}

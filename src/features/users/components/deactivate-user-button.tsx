'use client';

import { useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';

import { useDeactivateUser, type UserDetail } from '../api';
import { actionErrorMessage, type ActionFeedback } from '../action-feedback';

type DeactivateUserButtonProps = {
  user: UserDetail;
  onDone: (feedback: ActionFeedback) => void;
};

export function DeactivateUserButton({
  user,
  onDone,
}: DeactivateUserButtonProps) {
  const [open, setOpen] = useState(false);
  const deactivate = useDeactivateUser(user.id);

  const openDialog = () => {
    // Un error de un intento anterior no se arrastra a uno nuevo.
    deactivate.reset();
    setOpen(true);
  };

  const confirm = () =>
    deactivate.mutate(undefined, {
      onSuccess: () => {
        setOpen(false);
        onDone({
          variant: 'info',
          text: 'Cuenta desactivada. Se cerraron sus sesiones abiertas.',
        });
      },
    });

  return (
    <>
      <Button variant="destructive" onClick={openDialog}>
        Desactivar
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`¿Desactivar a ${user.full_name}?`}
        description="No podrá entrar al panel y se cerrarán sus sesiones abiertas. Su información y su historial se conservan, y puedes activarlo de nuevo cuando quieras."
        confirmLabel="Desactivar"
        pending={deactivate.isPending}
        error={
          deactivate.isError ? actionErrorMessage(deactivate.error) : undefined
        }
        onConfirm={confirm}
      />
    </>
  );
}

'use client';

import { useEffect } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';

import { actionErrorMessage, type ActionFeedback } from '../action-feedback';
import { useDeactivateUser } from '../api';

type DeactivateUserDialogProps = {
  user: { id: number; full_name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: (feedback: ActionFeedback) => void;
};

// Aparte del botón que lo abre: en la lista lo abre un elemento de menú, y un menú cerrado
// desmonta sus elementos, así que el diálogo no puede vivir dentro de él.
export function DeactivateUserDialog({
  user,
  open,
  onOpenChange,
  onDone,
}: DeactivateUserDialogProps) {
  const deactivate = useDeactivateUser(user.id);
  const { reset } = deactivate;

  // Un error de un intento anterior no se arrastra a uno nuevo.
  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const confirm = () =>
    deactivate.mutate(undefined, {
      onSuccess: () => {
        onOpenChange(false);
        onDone({
          variant: 'info',
          text: 'Cuenta desactivada. Se cerraron sus sesiones abiertas.',
        });
      },
    });

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`¿Desactivar a ${user.full_name}?`}
      description="No podrá entrar al panel y se cerrarán sus sesiones abiertas. Su información y su historial se conservan, y puedes activarlo de nuevo cuando quieras."
      confirmLabel="Desactivar"
      pending={deactivate.isPending}
      error={
        deactivate.isError ? actionErrorMessage(deactivate.error) : undefined
      }
      onConfirm={confirm}
    />
  );
}

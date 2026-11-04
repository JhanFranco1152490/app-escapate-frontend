'use client';

import { useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/features/auth/components/session-guard';

import { useUnlinkGoogle, type UserDetail } from '../api';
import { actionErrorMessage, type ActionFeedback } from '@/lib/action-feedback';

type UnlinkGoogleButtonProps = {
  user: UserDetail;
  onDone: (feedback: ActionFeedback) => void;
};

// Para cuando la persona cambia de Gmail o se sospecha de su cuenta de Google y no se la
// quiere desactivar.
export function UnlinkGoogleButton({ user, onDone }: UnlinkGoogleButtonProps) {
  const [open, setOpen] = useState(false);
  const unlink = useUnlinkGoogle(user.id);
  const isSelf = useCurrentUser().id === user.id;

  const openDialog = () => {
    unlink.reset();
    setOpen(true);
  };

  const confirm = () =>
    unlink.mutate(undefined, {
      onSuccess: () => {
        setOpen(false);
        onDone({
          variant: 'info',
          text: 'Google desvinculado. Se cerraron sus sesiones abiertas.',
        });
      },
    });

  return (
    <>
      <Button variant="outline" onClick={openDialog}>
        Desvincular Google
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`¿Desvincular la cuenta de Google de ${user.full_name}?`}
        description={
          isSelf
            ? 'Es tu propia cuenta: se cerrarán todas tus sesiones abiertas, incluida esta, y tendrás que volver a entrar. Podrás seguir entrando con tu documento, y la próxima vez que entres con Google se vinculará otra vez con el correo registrado.'
            : 'Se cerrarán todas sus sesiones abiertas. Podrá seguir entrando con su documento, y la próxima vez que entre con Google se vinculará otra vez con el correo registrado.'
        }
        confirmLabel="Desvincular"
        pending={unlink.isPending}
        error={unlink.isError ? actionErrorMessage(unlink.error) : undefined}
        onConfirm={confirm}
      />
    </>
  );
}

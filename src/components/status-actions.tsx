'use client';

import type { UseMutationResult } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { actionErrorMessage, type ActionFeedback } from '@/lib/action-feedback';

export type StatusAction = 'deactivate' | 'activate';

type StatusChange<T> = UseMutationResult<
  T,
  Error,
  { action: StatusAction; expectedVersion: number }
>;

type StatusActionsProps<T> = {
  active: boolean;
  // La versión de la ficha que se está mirando: así nadie cambia el estado con datos viejos.
  version: number;
  change: StatusChange<T>;
  confirmTitle: string;
  confirmDescription: string;
  doneMessages: Record<StatusAction, string>;
  onDone: (feedback: ActionFeedback) => void;
};

// Desactivar pide confirmación; activar no, porque devuelve el registro a la operación en vez
// de quitarlo. Si activar falla, el motivo sale en la ficha; si falla desactivar, dentro del
// diálogo.
export function StatusActions<T>({
  active,
  version,
  change,
  confirmTitle,
  confirmDescription,
  doneMessages,
  onDone,
}: StatusActionsProps<T>) {
  const [open, setOpen] = useState(false);
  const { reset } = change;

  // Un error de un intento anterior no se arrastra a uno nuevo.
  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const run = (action: StatusAction) =>
    change.mutate(
      { action, expectedVersion: version },
      {
        onSuccess: () => {
          setOpen(false);
          onDone({ variant: 'info', text: doneMessages[action] });
        },
        onError: (error) => {
          if (action === 'activate') {
            onDone({ variant: 'error', text: actionErrorMessage(error) });
          }
        },
      },
    );

  if (!active) {
    return (
      <Button disabled={change.isPending} onClick={() => run('activate')}>
        Activar
      </Button>
    );
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Desactivar
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel="Desactivar"
        pending={change.isPending}
        error={change.isError ? actionErrorMessage(change.error) : undefined}
        onConfirm={() => run('deactivate')}
      />
    </>
  );
}

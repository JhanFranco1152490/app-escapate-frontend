'use client';

import { Button } from '@/components/ui/button';

import { useActivateUser } from '../api';
import { actionError, type ActionFeedback } from '../action-feedback';

type ActivateUserButtonProps = {
  userId: number;
  onDone: (feedback: ActionFeedback) => void;
};

// Sin confirmación: devuelve el acceso, no lo quita.
export function ActivateUserButton({
  userId,
  onDone,
}: ActivateUserButtonProps) {
  const activate = useActivateUser(userId);

  return (
    <Button
      disabled={activate.isPending}
      onClick={() =>
        activate.mutate(undefined, {
          onSuccess: () =>
            onDone({
              variant: 'info',
              text: 'Cuenta activada. Ya puede entrar al panel.',
            }),
          onError: (error) => onDone(actionError(error)),
        })
      }
    >
      Activar
    </Button>
  );
}

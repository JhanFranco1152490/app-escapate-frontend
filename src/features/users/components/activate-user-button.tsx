'use client';

import { Button } from '@/components/ui/button';

import type { ActionFeedback } from '@/lib/action-feedback';
import { useActivateAction } from '../use-user-actions';

type ActivateUserButtonProps = {
  userId: number;
  onDone: (feedback: ActionFeedback) => void;
};

// Sin confirmación: devuelve el acceso, no lo quita.
export function ActivateUserButton({
  userId,
  onDone,
}: ActivateUserButtonProps) {
  const activate = useActivateAction(userId, onDone);

  return (
    <Button disabled={activate.pending} onClick={activate.run}>
      Activar
    </Button>
  );
}

'use client';

import { Button } from '@/components/ui/button';

import { useResendInvitation } from '../api';
import { actionError, type ActionFeedback } from '../action-feedback';

type ResendInvitationButtonProps = {
  userId: number;
  onDone: (feedback: ActionFeedback) => void;
};

export function ResendInvitationButton({
  userId,
  onDone,
}: ResendInvitationButtonProps) {
  const resend = useResendInvitation(userId);

  return (
    <Button
      variant="outline"
      disabled={resend.isPending}
      onClick={() =>
        resend.mutate(undefined, {
          onSuccess: () =>
            onDone({ variant: 'info', text: 'Invitación enviada.' }),
          onError: (error) => onDone(actionError(error)),
        })
      }
    >
      {resend.isPending ? 'Enviando…' : 'Reenviar invitación'}
    </Button>
  );
}

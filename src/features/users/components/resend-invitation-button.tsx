'use client';

import { Button } from '@/components/ui/button';

import type { ActionFeedback } from '@/lib/action-feedback';
import { useResendAction } from '../use-user-actions';

type ResendInvitationButtonProps = {
  userId: number;
  onDone: (feedback: ActionFeedback) => void;
};

export function ResendInvitationButton({
  userId,
  onDone,
}: ResendInvitationButtonProps) {
  const resend = useResendAction(userId, onDone);

  return (
    <Button variant="outline" disabled={resend.pending} onClick={resend.run}>
      {resend.pending ? 'Enviando…' : 'Reenviar invitación'}
    </Button>
  );
}

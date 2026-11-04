import { actionError, type ActionFeedback } from '@/lib/action-feedback';
import { useActivateUser, useResendInvitation } from './api';

type Notify = (feedback: ActionFeedback) => void;

// Las acciones sin confirmación, con los mismos textos en la ficha y en el menú de la lista.
export function useActivateAction(userId: number, onDone: Notify) {
  const activate = useActivateUser(userId);
  const run = () =>
    activate.mutate(undefined, {
      onSuccess: () =>
        onDone({
          variant: 'info',
          text: 'Cuenta activada. Ya puede entrar al panel.',
        }),
      onError: (error) => onDone(actionError(error)),
    });
  return { run, pending: activate.isPending };
}

export function useResendAction(userId: number, onDone: Notify) {
  const resend = useResendInvitation(userId);
  const run = () =>
    resend.mutate(undefined, {
      onSuccess: () => onDone({ variant: 'info', text: 'Invitación enviada.' }),
      onError: (error) => onDone(actionError(error)),
    });
  return { run, pending: resend.isPending };
}

'use client';

import { Pencil } from 'lucide-react';

import { ButtonLink } from '@/components/button-link';
import { useCurrentUser } from '@/features/auth/components/session-guard';
import { useHasPermission } from '@/features/auth/permissions';

import type { UserDetail } from '../api';
import type { ActionFeedback } from '@/lib/action-feedback';
import { ActivateUserButton } from './activate-user-button';
import { DeactivateUserButton } from './deactivate-user-button';
import { ResendInvitationButton } from './resend-invitation-button';
import { UnlinkGoogleButton } from './unlink-google-button';

type UserActionsProps = {
  user: UserDetail;
  onDone: (feedback: ActionFeedback) => void;
};

// Solo se ofrece lo que tiene sentido según el estado de la cuenta. Ocultar algo no lo
// protege: la API rechaza igual lo que no corresponde.
export function UserActions({ user, onDone }: UserActionsProps) {
  const canManage = useHasPermission('users.manage');
  const currentUser = useCurrentUser();
  if (!canManage) return null;

  const isSelf = user.id === currentUser.id;

  return (
    <>
      <ButtonLink href={`/usuarios/${user.id}/editar`} variant="outline">
        <Pencil aria-hidden="true" />
        Editar
      </ButtonLink>
      {user.is_active && !user.has_password && (
        <ResendInvitationButton userId={user.id} onDone={onDone} />
      )}
      {user.google_linked && <UnlinkGoogleButton user={user} onDone={onDone} />}
      {user.is_active && !isSelf && (
        <DeactivateUserButton user={user} onDone={onDone} />
      )}
      {!user.is_active && (
        <ActivateUserButton userId={user.id} onDone={onDone} />
      )}
    </>
  );
}

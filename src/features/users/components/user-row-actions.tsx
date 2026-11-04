'use client';

import { Ellipsis, Eye, Mail, Pencil, UserCheck, UserX } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrentUser } from '@/features/auth/components/session-guard';
import { useHasPermission } from '@/features/auth/permissions';

import type { ActionFeedback } from '@/lib/action-feedback';
import type { UserListItem } from '../api';
import { useActivateAction, useResendAction } from '../use-user-actions';
import { DeactivateUserDialog } from './deactivate-user-dialog';

type UserRowActionsProps = {
  user: UserListItem;
  onDone: (feedback: ActionFeedback) => void;
};

// La lista no trae si la cuenta tiene contraseña ni Google vinculado, así que aquí solo se
// ofrece lo que se puede decidir con sus datos; "Desvincular Google" y el reenvío para una
// cuenta que ya entró con Google quedan en la ficha. Ocultar algo no lo protege: la API
// rechaza igual lo que no corresponde.
export function UserRowActions({ user, onDone }: UserRowActionsProps) {
  const canManage = useHasPermission('users.manage');
  const isSelf = useCurrentUser().id === user.id;
  const [deactivating, setDeactivating] = useState(false);

  // En la lista el aviso no está junto a la ficha de nadie: dice de quién habla.
  const notify = (feedback: ActionFeedback) =>
    onDone({ ...feedback, text: `${user.full_name}: ${feedback.text}` });
  const activate = useActivateAction(user.id, notify);
  const resend = useResendAction(user.id, notify);

  const canResend = canManage && user.is_active && user.invitation_pending;
  const canActivate = canManage && !user.is_active;
  const canDeactivate = canManage && user.is_active && !isSelf;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Acciones de ${user.full_name}`}
            />
          }
        >
          <Ellipsis aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            className="min-h-11"
            render={<Link href={`/usuarios/${user.id}`} />}
          >
            <Eye aria-hidden="true" />
            Ver ficha
          </DropdownMenuItem>
          {canManage && (
            <DropdownMenuItem
              className="min-h-11"
              render={<Link href={`/usuarios/${user.id}/editar`} />}
            >
              <Pencil aria-hidden="true" />
              Editar
            </DropdownMenuItem>
          )}
          {canResend && (
            <DropdownMenuItem
              className="min-h-11"
              disabled={resend.pending}
              onClick={resend.run}
            >
              <Mail aria-hidden="true" />
              Reenviar invitación
            </DropdownMenuItem>
          )}
          {canActivate && (
            <DropdownMenuItem
              className="min-h-11"
              disabled={activate.pending}
              onClick={activate.run}
            >
              <UserCheck aria-hidden="true" />
              Activar
            </DropdownMenuItem>
          )}
          {canDeactivate && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="min-h-11"
                variant="destructive"
                onClick={() => setDeactivating(true)}
              >
                <UserX aria-hidden="true" />
                Desactivar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {canDeactivate && (
        <DeactivateUserDialog
          user={user}
          open={deactivating}
          onOpenChange={setDeactivating}
          onDone={notify}
        />
      )}
    </>
  );
}

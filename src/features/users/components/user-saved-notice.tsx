import type { ReactNode } from 'react';

import { Alert } from '@/components/alert';

import type { SavedNotice } from '../saved-notice';

function noticeText({ kind, invitationSent }: SavedNotice) {
  const saved = {
    created: 'Usuario creado',
    updated: 'Cambios guardados',
    role: 'Rol actualizado',
  }[kind];
  if (invitationSent === false)
    return `${saved}, pero no pudimos enviar la invitación.`;
  if (invitationSent === null) return `${saved}.`;
  return kind === 'created'
    ? 'Usuario creado. Le enviamos un correo para crear su contraseña.'
    : 'Cambios guardados. Le enviamos la invitación a su correo nuevo.';
}

type UserSavedNoticeProps = {
  notice: SavedNotice;
  // Para reintentar la invitación cuando el correo falló.
  action?: ReactNode;
};

export function UserSavedNotice({ notice, action }: UserSavedNoticeProps) {
  const failed = notice.invitationSent === false;
  return (
    <Alert variant={failed ? 'error' : 'info'} title={noticeText(notice)}>
      {failed && action && <div className="mt-3">{action}</div>}
    </Alert>
  );
}

'use client';

import { useEffect, useState } from 'react';

import { Alert } from '@/components/alert';
import { PageHeader } from '@/components/page-header';

import type { ActionFeedback } from '../action-feedback';
import { clearSavedNotice, readSavedNotice } from '../saved-notice';
import { parseUserId } from '../user-id';
import { LoginHistory } from './login-history';
import { ResendInvitationButton } from './resend-invitation-button';
import { UserActions } from './user-actions';
import { UserDetail } from './user-detail';
import { UserLoader } from './user-loader';
import { UserSavedNotice } from './user-saved-notice';

export function UserDetailScreen({ id }: { id: string }) {
  const userId = parseUserId(id);
  // Lo que dejó el formulario al guardar: se lee al montar y se borra enseguida, así no
  // reaparece al volver a abrir la ficha.
  const [notice] = useState(() =>
    userId === null ? undefined : readSavedNotice(userId),
  );
  useEffect(clearSavedNotice, []);
  // Resultado de la última acción (activar, reenviar…). Reemplaza al aviso de guardado: es
  // más reciente.
  const [feedback, setFeedback] = useState<ActionFeedback>();

  return (
    <UserLoader userId={userId} back={{ href: '/usuarios', label: 'Usuarios' }}>
      {(user) => (
        <>
          <PageHeader
            eyebrow="Administración / 02"
            title={user.full_name}
            actions={<UserActions user={user} onDone={setFeedback} />}
          />
          {feedback ? (
            <Alert variant={feedback.variant} title={feedback.text} />
          ) : (
            notice && (
              <UserSavedNotice
                notice={notice}
                action={
                  user.is_active &&
                  !user.has_password && (
                    <ResendInvitationButton
                      userId={user.id}
                      onDone={setFeedback}
                    />
                  )
                }
              />
            )
          )}
          <UserDetail user={user} />
          <LoginHistory userId={user.id} />
        </>
      )}
    </UserLoader>
  );
}

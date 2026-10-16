import { Alert } from '@/components/alert';

import { googleLoginUrl } from '../google-login-url';
import type { DocumentValues } from '../schemas';
import { RecoveryLink } from './recovery-link';

const LINK_CLASS = 'font-semibold underline underline-offset-2';

type LockedNoticeProps = {
  title: string;
  document: DocumentValues | undefined;
  next: string | null;
};

// El bloqueo es solo de la vía con documento: restablecer la contraseña lo quita al instante
// y Google no pasa por él.
export function LockedNotice({ title, document, next }: LockedNoticeProps) {
  return (
    <Alert variant="error">
      <span className="font-semibold">{title}</span> Puedes esperar 15 minutos,{' '}
      <RecoveryLink getDocument={() => document} className={LINK_CLASS}>
        restablecer tu contraseña
      </RecoveryLink>{' '}
      o{' '}
      <a href={googleLoginUrl(next)} className={LINK_CLASS}>
        entrar con Google
      </a>
      .
    </Alert>
  );
}

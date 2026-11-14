'use client';

import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { lazy, useEffect, useState } from 'react';

import { Alert } from '@/components/alert';

import { useLogin, useSession } from '../api';
import { loginNoticeFromUrl } from '../login-errors';
import { safeNext } from '@/lib/safe-next';
import type { DocumentValues, LoginValues } from '../schemas';
import { AuthShell } from './auth-shell';
import { DocumentLoginForm } from './document-login-form';
import { GoogleButton } from './google-button';
import { LockedNotice } from './locked-notice';

// La comparación va escrita aquí, con la variable completa, para que al compilar sin la
// bandera el compilador descarte la rama y el import dinámico: así las cuentas de
// demostración y sus contraseñas no llegan al navegador en producción.
const DemoAccountsMenu =
  process.env.NEXT_PUBLIC_DEMO_ACCOUNTS === 'true'
    ? lazy(() =>
        import('./demo-accounts-menu').then((module) => ({
          default: module.DemoAccountsMenu,
        })),
      )
    : undefined;

export function LoginScreen() {
  const [next] = useQueryState('next');
  const [error, setError] = useQueryState('error');
  // Se toma al montar: el parámetro se quita enseguida de la URL para que el aviso no
  // reaparezca al recargar, pero el aviso sigue a la vista.
  const [notice, setNotice] = useState(() => loginNoticeFromUrl(error));
  const router = useRouter();
  const login = useLogin();
  const session = useSession();
  // El login exitoso también deja la sesión en la caché (antes de terminar la mutación).
  // Mientras haya un login en curso o recién hecho, la redirección es la del envío, hacia
  // next; si no, se descartaría next con una segunda redirección a la página principal.
  const loggingIn = login.isPending || login.isSuccess;
  // isSuccess y no data: tras un 401 la caché conserva el último usuario, y tomarlo por
  // una sesión activa devolvería al panel, que a su vez mandaría aquí, sin fin.
  const hadSession = session.isSuccess && !loggingIn;

  // Último documento enviado, para precargarlo si el aviso ofrece restablecer la contraseña.
  const [lastDocument, setLastDocument] = useState<DocumentValues>();

  async function submitLogin(values: LoginValues) {
    setLastDocument({
      document_type: values.document_type,
      document_number: values.document_number,
    });
    await login.mutateAsync(values);
    router.replace(safeNext(next));
  }

  useEffect(() => {
    if (hadSession) router.replace('/');
  }, [hadSession, router]);

  useEffect(() => {
    if (error !== null) void setError(null);
  }, [error, setError]);

  if (hadSession) return null;

  return (
    <AuthShell eyebrow="Portal de asesores" title="Iniciar sesión">
      {notice?.recovery ? (
        <LockedNotice
          title={notice.message}
          document={lastDocument}
          next={next}
        />
      ) : (
        notice && <Alert variant={notice.variant}>{notice.message}</Alert>
      )}
      <DocumentLoginForm
        onSubmit={submitLogin}
        onNotice={setNotice}
        QuickAccess={DemoAccountsMenu}
      />
      <div
        role="separator"
        className="flex items-center gap-3 font-mono text-[0.625rem] tracking-[0.2em] text-muted-foreground uppercase"
      >
        <span aria-hidden="true" className="h-px flex-1 bg-border" />o
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton next={next} />
    </AuthShell>
  );
}

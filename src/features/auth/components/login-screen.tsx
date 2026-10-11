'use client';

import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';

import { Alert } from '@/components/alert';

import { useLogin, useSession } from '../api';
import { loginNoticeFromUrl } from '../login-errors';
import { safeNext } from '../safe-next';
import type { LoginValues } from '../schemas';
import { BrandPanel } from './brand-panel';
import { DocumentLoginForm } from './document-login-form';
import { GoogleButton } from './google-button';

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

  async function submitLogin(values: LoginValues) {
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
    <main className="dark-surface flex min-h-dvh bg-navy-950 text-foreground">
      <BrandPanel />
      <section className="flex flex-1 items-center justify-center px-4 py-6 sm:px-12 md:w-96 md:flex-none md:px-10 lg:w-140 lg:px-12">
        <div className="flex w-full max-w-md flex-col gap-4">
          <header>
            <p className="font-mono text-[0.625rem] tracking-[0.2em] text-orange-400 uppercase">
              Portal de asesores
            </p>
            <h1 className="mt-2 font-heading text-[2rem] font-semibold tracking-[-0.03em]">
              Iniciar sesión
            </h1>
          </header>
          {notice && <Alert variant={notice.variant}>{notice.message}</Alert>}
          <DocumentLoginForm onSubmit={submitLogin} onNotice={setNotice} />
          <div
            role="separator"
            className="flex items-center gap-3 font-mono text-[0.625rem] tracking-[0.2em] text-muted-foreground uppercase"
          >
            <span aria-hidden="true" className="h-px flex-1 bg-border" />o
            <span aria-hidden="true" className="h-px flex-1 bg-border" />
          </div>
          <GoogleButton next={next} />
        </div>
      </section>
    </main>
  );
}

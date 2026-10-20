'use client';

import { useState } from 'react';

import { ErrorState } from '@/components/error-state';
import { Button } from '@/components/ui/button';
import { isApiError, rateLimitOr } from '@/lib/api/errors';

import { useResetTokenCheck, type TokenPurpose } from '../api';
import { useResetTokenFromHash } from '../reset-token';
import { AuthShell } from './auth-shell';
import { BackToLoginLink } from './back-to-login-link';
import { ExpiredLinkState } from './expired-link-state';
import { SetPasswordForm } from './set-password-form';

const TEXTS = {
  reset: {
    eyebrow: 'Paso 2 de 2',
    title: () => 'Restablecer contraseña',
    intro: undefined,
    submit: 'Guardar contraseña',
    submitting: 'Guardando…',
  },
  invitation: {
    eyebrow: 'Portal de asesores',
    title: (name?: string) =>
      name ? `Te damos la bienvenida, ${name}` : 'Crea tu contraseña',
    intro: 'Crea la contraseña con la que vas a entrar al panel.',
    submit: 'Crear contraseña',
    submitting: 'Creando…',
  },
} satisfies Record<TokenPurpose, unknown>;

// La ruta solo dice qué enlace se esperaba; si el token resulta ser del otro tipo, mandan los
// textos de lo que respondió la API.
export function SetPasswordScreen({
  linkPurpose,
}: {
  linkPurpose: TokenPurpose;
}) {
  const token = useResetTokenFromHash();
  const check = useResetTokenCheck(token);
  const [expired, setExpired] = useState(false);
  const purpose = check.data?.purpose ?? linkPurpose;
  const texts = TEXTS[purpose];

  const invalidToken =
    isApiError(check.error) && check.error.code === 'invalid_reset_token';
  if (token === null || expired || invalidToken) {
    return (
      <AuthShell eyebrow={texts.eyebrow} title="Enlace vencido">
        <ExpiredLinkState purpose={purpose} />
      </AuthShell>
    );
  }

  if (check.isError) {
    return (
      <AuthShell eyebrow={texts.eyebrow} title={texts.title()}>
        <ErrorState
          title="No pudimos comprobar el enlace"
          action={
            <Button variant="outline" onClick={() => void check.refetch()}>
              Reintentar
            </Button>
          }
        >
          {rateLimitOr(check.error, 'Revisa tu conexión e inténtalo de nuevo.')}
        </ErrorState>
      </AuthShell>
    );
  }

  if (!token || !check.data) {
    return (
      <AuthShell eyebrow={texts.eyebrow} title={texts.title()}>
        <p role="status" className="text-[0.875rem] text-muted-foreground">
          Comprobando el enlace…
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={texts.eyebrow}
      title={texts.title(check.data.full_name)}
    >
      {texts.intro && (
        <p className="text-[0.875rem] leading-normal text-muted-foreground">
          {texts.intro}
        </p>
      )}
      <SetPasswordForm
        token={token}
        submitLabel={texts.submit}
        submittingLabel={texts.submitting}
        onExpired={() => setExpired(true)}
      />
      <BackToLoginLink />
    </AuthShell>
  );
}

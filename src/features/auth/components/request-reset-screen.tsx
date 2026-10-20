'use client';

import { useState } from 'react';

import { Alert } from '@/components/alert';

import { useRequestPasswordReset } from '../api';
import { AuthShell } from './auth-shell';
import { BackToLoginLink } from './back-to-login-link';
import { RequestResetForm } from './request-reset-form';

export function RequestResetScreen() {
  const request = useRequestPasswordReset();
  const [error, setError] = useState<string>();

  return (
    <AuthShell eyebrow="Paso 1 de 2" title="Recuperar contraseña">
      {request.isSuccess ? (
        // El texto no confirma si la cuenta existe: la API responde igual en los dos casos.
        <Alert variant="info" title="Solicitud enviada.">
          Si los datos corresponden a una cuenta, enviamos un enlace a su
          correo. Vence en 30 minutos.
        </Alert>
      ) : (
        <>
          <p className="text-[0.875rem] leading-normal text-muted-foreground">
            Escribe el documento con el que entras al panel. Te enviaremos un
            enlace a tu correo registrado.
          </p>
          {error && <Alert>{error}</Alert>}
          <RequestResetForm onSubmit={request.mutateAsync} onError={setError} />
        </>
      )}
      <BackToLoginLink />
    </AuthShell>
  );
}

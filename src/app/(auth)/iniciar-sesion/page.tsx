import type { Metadata } from 'next';
import { Suspense } from 'react';

import { LoginScreen } from '@/features/auth/components/login-screen';

export const metadata: Metadata = { title: 'Iniciar sesión · Escápate' };

// Suspense porque la pantalla lee la URL (next y error), que solo existe en el navegador.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginScreen />
    </Suspense>
  );
}

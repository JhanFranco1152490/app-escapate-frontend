import type { Metadata } from 'next';

import { RequestResetScreen } from '@/features/auth/components/request-reset-screen';

export const metadata: Metadata = { title: 'Recuperar contraseña · Escápate' };

export default function RequestResetPage() {
  return <RequestResetScreen />;
}

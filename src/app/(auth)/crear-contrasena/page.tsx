import type { Metadata } from 'next';

import { SetPasswordScreen } from '@/features/auth/components/set-password-screen';

export const metadata: Metadata = { title: 'Crear contraseña · Escápate' };

export default function CreatePasswordPage() {
  return <SetPasswordScreen linkPurpose="invitation" />;
}

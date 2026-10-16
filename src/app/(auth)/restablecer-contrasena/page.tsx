import type { Metadata } from 'next';

import { SetPasswordScreen } from '@/features/auth/components/set-password-screen';

export const metadata: Metadata = {
  title: 'Restablecer contraseña · Escápate',
};

export default function ResetPasswordPage() {
  return <SetPasswordScreen linkPurpose="reset" />;
}

import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';

import type { TokenPurpose } from '../api';
import { BackToLoginLink } from './back-to-login-link';

export function ExpiredLinkState({ purpose }: { purpose: TokenPurpose }) {
  return (
    <>
      <div className="flex flex-col gap-2 text-[0.875rem] leading-normal text-muted-foreground">
        <p>Este enlace no es válido o ya venció.</p>
        {purpose === 'invitation' && (
          <p>Pide a un administrador que te envíe una invitación nueva.</p>
        )}
      </div>
      {purpose === 'reset' && (
        <Link
          href="/recuperar-contrasena"
          className={buttonVariants({ className: 'w-full' })}
        >
          Pedir un enlace nuevo
        </Link>
      )}
      <BackToLoginLink />
    </>
  );
}

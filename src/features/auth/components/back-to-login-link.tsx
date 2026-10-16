import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';

export function BackToLoginLink() {
  return (
    <Link
      href="/iniciar-sesion"
      className={buttonVariants({ variant: 'link', className: 'self-center' })}
    >
      Volver a iniciar sesión
    </Link>
  );
}

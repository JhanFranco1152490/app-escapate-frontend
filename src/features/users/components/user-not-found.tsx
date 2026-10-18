import Link from 'next/link';

import { EmptyState } from '@/components/empty-state';
import { buttonVariants } from '@/components/ui/button';

export function UserNotFound() {
  return (
    <EmptyState
      title="No encontramos este usuario"
      action={
        <Link
          href="/usuarios"
          className={buttonVariants({ variant: 'outline' })}
        >
          Volver a usuarios
        </Link>
      }
    >
      Puede que el enlace esté mal escrito. Búscalo en la lista de usuarios.
    </EmptyState>
  );
}

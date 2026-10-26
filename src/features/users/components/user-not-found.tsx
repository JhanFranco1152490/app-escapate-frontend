import { ButtonLink } from '@/components/button-link';
import { EmptyState } from '@/components/empty-state';

export function UserNotFound() {
  return (
    <EmptyState
      title="No encontramos este usuario"
      action={
        <ButtonLink href="/usuarios" variant="outline">
          Volver a usuarios
        </ButtonLink>
      }
    >
      Puede que el enlace esté mal escrito. Búscalo en la lista de usuarios.
    </EmptyState>
  );
}

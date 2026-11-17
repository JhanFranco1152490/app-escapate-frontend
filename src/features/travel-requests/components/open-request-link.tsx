import { ButtonLink } from '@/components/button-link';

import type { TravelRequestListItem } from '../api';

// "Abrir" de una fila. Lleva el código en su nombre accesible porque todas las filas tienen el
// mismo botón.
export function OpenRequestLink({
  request,
}: {
  request: Pick<TravelRequestListItem, 'id' | 'code'>;
}) {
  return (
    <ButtonLink
      href={`/solicitudes/${request.id}`}
      variant="outline"
      size="sm"
      aria-label={`Abrir ${request.code}`}
    >
      Abrir
    </ButtonLink>
  );
}

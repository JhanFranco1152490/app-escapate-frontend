import { ClipboardList, Plus } from 'lucide-react';

import { ButtonLink } from '@/components/button-link';
import { useHasPermission } from '@/features/auth/permissions';

// Las solicitudes de viaje dependen de los clientes, no al revés: por eso aquí solo hay
// enlaces con la ruta escrita y ninguna importación de ese módulo.
export function ClientRequestLinks({ clientId }: { clientId: number }) {
  const canView = useHasPermission('travel_requests.view');
  const canManage = useHasPermission('travel_requests.manage');
  if (!canView) return null;

  return (
    <>
      <ButtonLink href={`/solicitudes?client_id=${clientId}`} variant="outline">
        <ClipboardList aria-hidden="true" />
        Ver solicitudes
      </ButtonLink>
      {canManage && (
        <ButtonLink href={`/solicitudes/nueva?client_id=${clientId}`}>
          <Plus aria-hidden="true" />
          Nueva solicitud
        </ButtonLink>
      )}
    </>
  );
}

'use client';

import { Alert } from '@/components/alert';
import { ButtonLink } from '@/components/button-link';
import { PageHeader } from '@/components/page-header';
import { parseRouteId } from '@/lib/route-id';

import { EditRequestForm } from './edit-request-form';
import { RequestLoader } from './request-loader';

// Mismo texto que la API: una solicitud cerrada no se edita hasta que se reabre.
const CLOSED_MESSAGE = 'La solicitud está cerrada. Reábrela para modificarla.';

export function EditRequestScreen({ id }: { id: string }) {
  const requestId = parseRouteId(id);

  return (
    <RequestLoader
      requestId={requestId}
      back={{ href: `/solicitudes/${id}`, label: 'Volver a la ficha' }}
    >
      {(request) =>
        request.status === 'closed' ? (
          <div className="flex max-w-3xl flex-col gap-5">
            <PageHeader
              eyebrow="Operación / 04"
              title={`Editar solicitud ${request.code}`}
            />
            <Alert variant="info" title={CLOSED_MESSAGE} />
            <div>
              <ButtonLink href={`/solicitudes/${request.id}`} variant="outline">
                Ir a la ficha para reabrirla
              </ButtonLink>
            </div>
          </div>
        ) : (
          <EditRequestForm request={request} />
        )
      }
    </RequestLoader>
  );
}

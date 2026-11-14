'use client';

import { useRouter } from 'next/navigation';
import { parseAsString, useQueryState } from 'nuqs';

import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/features/auth/components/session-guard';
import { useHasPermission } from '@/features/auth/permissions';
import { useClient } from '@/features/clients/api';
import { setPageNotice } from '@/lib/page-notice';
import { parseRouteId } from '@/lib/route-id';

import { useCreateTravelRequest } from '../api';
import { emptyRequestForm } from '../form-values';
import { requestNoticeTarget } from '../request-notice';
import type { RequestPayload } from '../schemas';
import { RequestForm } from './request-form';

export function CreateRequestScreen() {
  const router = useRouter();
  const user = useCurrentUser();
  const createRequest = useCreateTravelRequest();
  const canViewClients = useHasPermission('clients.view');
  // Llega desde la ficha del cliente o de vuelta del alta de un cliente nuevo. Sin
  // `clients.view` no se puede mostrar su nombre: se empieza sin él.
  const [clientParam] = useQueryState('client_id', parseAsString);
  const fromClient = parseRouteId(clientParam ?? '');
  const clientId = canViewClients ? fromClient : null;
  const client = useClient(clientId);

  const submit = async (payload: RequestPayload) => {
    const request = await createRequest.mutateAsync(payload);
    setPageNotice({
      target: requestNoticeTarget(request.id),
      text: 'Solicitud registrada.',
    });
    router.push(`/solicitudes/${request.id}`);
  };

  return (
    <div className="flex max-w-3xl flex-col gap-7">
      <PageHeader
        eyebrow="Operación / 04"
        title="Nueva solicitud"
        description="Lo que el cliente pide para su viaje. Cada solicitud es independiente, aunque se parezca a otra del mismo cliente."
      />
      {clientId !== null && client.isPending ? (
        <div role="status" aria-label="Cargando el cliente">
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        // Un cliente que no existe o no se pudo cargar no impide registrar: se empieza sin él.
        <RequestForm
          mode="create"
          defaultValues={emptyRequestForm({
            client: client.data
              ? { id: client.data.id, name: client.data.display_name }
              : null,
            advisorId: user.id,
          })}
          submitLabel="Guardar solicitud"
          cancelHref={fromClient ? `/clientes/${fromClient}` : '/solicitudes'}
          onSubmit={submit}
        />
      )}
    </div>
  );
}

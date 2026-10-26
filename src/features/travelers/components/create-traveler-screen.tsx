'use client';

import { useRouter } from 'next/navigation';
import { parseAsString, useQueryStates } from 'nuqs';

import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useHasPermission } from '@/features/auth/permissions';
import { useClient, type ClientDetail } from '@/features/clients/api';
import { setPageNotice } from '@/lib/page-notice';
import { parseRouteId } from '@/lib/route-id';

import { useCreateTraveler } from '../api';
import {
  EMPTY_TRAVELER_FORM,
  fromClient,
  withReferenceClient,
} from '../form-values';
import type { TravelerPayload } from '../schemas';
import { travelerNoticeTarget } from '../traveler-notice';
import { TravelerForm } from './traveler-form';

const params = { client_id: parseAsString, from_client: parseAsString };

// Con qué empieza el formulario: vacío, con el cliente de referencia elegido (llega desde la
// ficha del cliente) o con los datos del cliente copiados ("Registrar como viajero"). Copiar
// solo tiene sentido con una persona: una empresa queda solo como cliente de referencia.
function initialValues(client: ClientDetail | undefined, copy: boolean) {
  if (!client) return EMPTY_TRAVELER_FORM;
  if (copy && client.client_type === 'person') return fromClient(client);
  return withReferenceClient(client);
}

export function CreateTravelerScreen() {
  const router = useRouter();
  const createTraveler = useCreateTraveler();
  const canViewClients = useHasPermission('clients.view');
  const [query] = useQueryStates(params);
  const copyFrom = parseRouteId(query.from_client ?? '');
  // Sin `clients.view` no se puede mostrar el nombre del cliente: se empieza sin él.
  const sourceId = canViewClients
    ? (copyFrom ?? parseRouteId(query.client_id ?? ''))
    : null;
  const source = useClient(sourceId);

  const submit = async (payload: TravelerPayload) => {
    // El formulario no deja enviar sin la casilla marcada.
    const traveler = await createTraveler.mutateAsync({
      ...payload,
      data_consent: true,
    });
    setPageNotice({
      target: travelerNoticeTarget(traveler.id),
      text: 'Viajero registrado.',
    });
    router.push(`/viajeros/${traveler.id}`);
  };

  return (
    <div className="flex max-w-3xl flex-col gap-7">
      <PageHeader
        eyebrow="Operación / 03"
        title="Nuevo viajero"
        description="Quien realmente viaja. Sus datos se guardan aparte de los del cliente, aunque sea la misma persona."
      />
      {sourceId !== null && source.isPending ? (
        <div role="status" aria-label="Cargando el cliente">
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        // Un cliente que no existe o no se pudo cargar no impide registrar: se empieza vacío.
        <TravelerForm
          mode="create"
          defaultValues={initialValues(source.data, copyFrom !== null)}
          submitLabel="Guardar viajero"
          cancelHref={sourceId ? `/clientes/${sourceId}` : '/viajeros'}
          onSubmit={submit}
        />
      )}
    </div>
  );
}

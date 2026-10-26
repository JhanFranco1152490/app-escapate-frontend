'use client';

import { parseRouteId } from '@/lib/route-id';

import { ClientLoader } from './client-loader';
import { EditClientForm } from './edit-client-form';

export function EditClientScreen({ id }: { id: string }) {
  const clientId = parseRouteId(id);

  return (
    <ClientLoader
      clientId={clientId}
      back={{ href: `/clientes/${id}`, label: 'Volver a la ficha' }}
    >
      {(client) => <EditClientForm client={client} />}
    </ClientLoader>
  );
}

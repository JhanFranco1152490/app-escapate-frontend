'use client';

import { parseRouteId } from '@/lib/route-id';

import { EditServiceForm } from './edit-service-form';
import { ServiceLoader } from './service-loader';

export function EditServiceScreen({ id }: { id: string }) {
  return (
    <ServiceLoader
      serviceId={parseRouteId(id)}
      back={{ href: `/servicios/${id}`, label: 'Volver al servicio' }}
    >
      {(service) => <EditServiceForm service={service} />}
    </ServiceLoader>
  );
}

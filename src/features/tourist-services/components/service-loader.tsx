'use client';

import type { ReactNode } from 'react';

import { ButtonLink } from '@/components/button-link';
import { EmptyState } from '@/components/empty-state';
import { RecordLoader } from '@/components/record-loader';

import { useTouristService, type TouristServiceDetail } from '../api';

type ServiceLoaderProps = {
  // null si el id de la URL es imposible: no se pide a la API.
  serviceId: number | null;
  children: (service: TouristServiceDetail) => ReactNode;
};

function ServiceNotFound() {
  return (
    <EmptyState
      title="No encontramos este servicio"
      action={
        <ButtonLink href="/proveedores" variant="outline">
          Volver a proveedores
        </ButtonLink>
      }
    >
      Puede que el enlace esté mal escrito. Búscalo en la ficha de su proveedor.
    </EmptyState>
  );
}

// Sin enlace de vuelta fijo: la ruta lleva al proveedor del servicio, que se conoce al
// cargarlo.
export function ServiceLoader({ serviceId, children }: ServiceLoaderProps) {
  return (
    <RecordLoader
      validId={serviceId !== null}
      query={useTouristService(serviceId)}
      notFound={<ServiceNotFound />}
      errorTitle="No pudimos cargar el servicio"
      loadingLabel="Cargando el servicio"
    >
      {children}
    </RecordLoader>
  );
}

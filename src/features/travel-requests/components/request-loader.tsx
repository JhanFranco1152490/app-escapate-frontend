'use client';

import type { ReactNode } from 'react';

import { ButtonLink } from '@/components/button-link';
import { EmptyState } from '@/components/empty-state';
import { RecordLoader } from '@/components/record-loader';

import { useTravelRequest, type TravelRequestDetail } from '../api';

type RequestLoaderProps = {
  // null si el id de la URL es imposible: no se pide a la API.
  requestId: number | null;
  back: { href: string; label: string };
  children: (request: TravelRequestDetail) => ReactNode;
};

function RequestNotFound() {
  return (
    <EmptyState
      title="No encontramos esta solicitud"
      action={
        <ButtonLink href="/solicitudes" variant="outline">
          Volver a solicitudes
        </ButtonLink>
      }
    >
      Puede que el enlace esté mal escrito. Búscala por su código en la lista de
      solicitudes.
    </EmptyState>
  );
}

export function RequestLoader({
  requestId,
  back,
  children,
}: RequestLoaderProps) {
  return (
    <RecordLoader
      validId={requestId !== null}
      query={useTravelRequest(requestId)}
      back={back}
      notFound={<RequestNotFound />}
      errorTitle="No pudimos cargar la solicitud"
      loadingLabel="Cargando la solicitud"
    >
      {children}
    </RecordLoader>
  );
}

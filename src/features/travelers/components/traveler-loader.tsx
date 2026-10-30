'use client';

import type { ReactNode } from 'react';

import { ButtonLink } from '@/components/button-link';
import { EmptyState } from '@/components/empty-state';
import { RecordLoader } from '@/components/record-loader';

import { useTraveler, type TravelerDetail } from '../api';

type TravelerLoaderProps = {
  // null si el id de la URL es imposible: no se pide a la API.
  travelerId: number | null;
  back: { href: string; label: string };
  children: (traveler: TravelerDetail) => ReactNode;
};

function TravelerNotFound() {
  return (
    <EmptyState
      title="No encontramos este viajero"
      action={
        <ButtonLink href="/viajeros" variant="outline">
          Volver a viajeros
        </ButtonLink>
      }
    >
      Puede que el enlace esté mal escrito. Búscalo en la lista de viajeros.
    </EmptyState>
  );
}

export function TravelerLoader({
  travelerId,
  back,
  children,
}: TravelerLoaderProps) {
  return (
    <RecordLoader
      validId={travelerId !== null}
      query={useTraveler(travelerId)}
      back={back}
      notFound={<TravelerNotFound />}
      errorTitle="No pudimos cargar el viajero"
      loadingLabel="Cargando el viajero"
    >
      {children}
    </RecordLoader>
  );
}

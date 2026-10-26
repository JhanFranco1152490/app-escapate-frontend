'use client';

import type { ReactNode } from 'react';

import { ButtonLink } from '@/components/button-link';
import { EmptyState } from '@/components/empty-state';
import { RecordLoader } from '@/components/record-loader';

import { useClient, type ClientDetail } from '../api';

type ClientLoaderProps = {
  // null si el id de la URL es imposible: no se pide a la API.
  clientId: number | null;
  back: { href: string; label: string };
  children: (client: ClientDetail) => ReactNode;
};

function ClientNotFound() {
  return (
    <EmptyState
      title="No encontramos este cliente"
      action={
        <ButtonLink href="/clientes" variant="outline">
          Volver a clientes
        </ButtonLink>
      }
    >
      Puede que el enlace esté mal escrito. Búscalo en la lista de clientes.
    </EmptyState>
  );
}

export function ClientLoader({ clientId, back, children }: ClientLoaderProps) {
  return (
    <RecordLoader
      validId={clientId !== null}
      query={useClient(clientId)}
      back={back}
      notFound={<ClientNotFound />}
      errorTitle="No pudimos cargar el cliente"
      loadingLabel="Cargando el cliente"
    >
      {children}
    </RecordLoader>
  );
}

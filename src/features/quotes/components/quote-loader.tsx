'use client';

import type { ReactNode } from 'react';

import { ButtonLink } from '@/components/button-link';
import { EmptyState } from '@/components/empty-state';
import { RecordLoader } from '@/components/record-loader';

import { useQuote, type QuoteDetail } from '../api';

type QuoteLoaderProps = {
  // null si el id de la URL es imposible: no se pide a la API.
  quoteId: number | null;
  back: { href: string; label: string };
  children: (quote: QuoteDetail) => ReactNode;
};

function QuoteNotFound() {
  return (
    <EmptyState
      title="No encontramos esta cotización"
      action={
        <ButtonLink href="/cotizaciones" variant="outline">
          Volver a cotizaciones
        </ButtonLink>
      }
    >
      Puede que el enlace esté mal escrito. Búscala por su código en la lista de
      cotizaciones.
    </EmptyState>
  );
}

export function QuoteLoader({ quoteId, back, children }: QuoteLoaderProps) {
  return (
    <RecordLoader
      validId={quoteId !== null}
      query={useQuote(quoteId)}
      back={back}
      notFound={<QuoteNotFound />}
      errorTitle="No pudimos cargar la cotización"
      loadingLabel="Cargando la cotización"
    >
      {children}
    </RecordLoader>
  );
}

'use client';

import { Printer } from 'lucide-react';

import { Alert } from '@/components/alert';
import { ButtonLink } from '@/components/button-link';
import { Button } from '@/components/ui/button';
import { parseRouteId } from '@/lib/route-id';

import { QuoteDocument } from './quote-document';
import { QuoteLoader } from './quote-loader';

// El documento para el cliente. Se descarga en PDF con el diálogo de impresión del navegador
// ("Guardar como PDF"): no hace falta generar el archivo en el servidor para enviarlo.
export function QuoteDocumentScreen({ id }: { id: string }) {
  const quoteId = parseRouteId(id);
  return (
    <QuoteLoader
      quoteId={quoteId}
      back={{ href: `/cotizaciones/${id}`, label: 'Volver a la ficha' }}
    >
      {(quote) => (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-3 print:hidden">
            <ButtonLink href={`/cotizaciones/${quote.id}`} variant="outline">
              Volver a la ficha
            </ButtonLink>
            <Button onClick={() => window.print()}>
              <Printer aria-hidden="true" />
              Imprimir o guardar PDF
            </Button>
          </div>
          {quote.totals.missing_exchange_rate && (
            <div className="print:hidden">
              <Alert title="Hay servicios en dólares sin tasa de cambio: el total no los incluye." />
            </div>
          )}
          <QuoteDocument quote={quote} />
        </div>
      )}
    </QuoteLoader>
  );
}

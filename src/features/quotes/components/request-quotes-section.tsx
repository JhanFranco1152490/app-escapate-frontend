'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Alert } from '@/components/alert';
import { Button } from '@/components/ui/button';
import { useHasPermission } from '@/features/auth/permissions';
import { actionErrorMessage } from '@/lib/action-feedback';
import { formatShortDate } from '@/lib/format/dates';
import { setPageNotice } from '@/lib/page-notice';

import { useQuotes } from '../api';
import { quoteNoticeTarget } from '../format';
import { useCreateQuote } from '../mutations';
import { QuoteFromPackage } from './quote-from-package';
import { QuoteStatusBadge } from './quote-status-badge';

type RequestQuotesSectionProps = {
  requestId: number;
  // Una solicitud cerrada no se cotiza hasta que se reabre.
  closed: boolean;
};

// Las cotizaciones de una solicitud, en su ficha, y el botón para crear una nueva: copia los
// datos de la solicitud y lleva a la cotización para seguir armándola.
export function RequestQuotesSection({
  requestId,
  closed,
}: RequestQuotesSectionProps) {
  const router = useRouter();
  const canView = useHasPermission('quotes.view');
  const canManage = useHasPermission('quotes.manage');
  const quotes = useQuotes(
    {
      q: '',
      status: null,
      clientId: null,
      travelRequestId: requestId,
      page: 1,
    },
    canView,
  );
  const create = useCreateQuote();

  if (!canView) return null;

  const createQuote = () =>
    create.mutate(requestId, {
      onSuccess: (quote) => {
        setPageNotice({
          target: quoteNoticeTarget(quote.id),
          text: 'Cotización creada con los datos de la solicitud. Agrega sus servicios.',
        });
        router.push(`/cotizaciones/${quote.id}`);
      },
    });

  const rows = quotes.data?.results ?? [];

  return (
    <section
      aria-labelledby="request-quotes-title"
      className="rounded-md border bg-card"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <h2
          id="request-quotes-title"
          className="font-heading text-lg font-semibold"
        >
          Cotizaciones
        </h2>
        {canManage && !closed && (
          <Button onClick={createQuote} disabled={create.isPending}>
            <Plus aria-hidden="true" />
            {create.isPending ? 'Creando…' : 'Crear cotización'}
          </Button>
        )}
      </header>
      {create.isError && (
        <div className="px-5 pt-4">
          <Alert title={actionErrorMessage(create.error)} />
        </div>
      )}
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">
          {quotes.isPending
            ? 'Cargando…'
            : 'Esta solicitud todavía no tiene cotizaciones.'}
        </p>
      ) : (
        <ul className="divide-y">
          {rows.map((quote) => (
            <li
              key={quote.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
            >
              <Link
                href={`/cotizaciones/${quote.id}`}
                className="font-mono text-[0.8125rem] font-medium underline-offset-4 hover:underline"
              >
                {quote.code}
              </Link>
              <span className="text-sm text-muted-foreground">
                Vigente hasta {formatShortDate(quote.valid_until)}
              </span>
              <QuoteStatusBadge quote={quote} />
            </li>
          ))}
        </ul>
      )}
      {canManage && !closed && <QuoteFromPackage requestId={requestId} />}
    </section>
  );
}

import { DetailItem } from '@/components/detail-item';
import { formatDateTime, formatShortDate } from '@/lib/format/dates';
import { formatPercentage } from '@/lib/format/money';

import type { QuoteDetail } from '../api';
import { formatQuoteDates } from '../format';
import { QuoteStatusBadge } from './quote-status-badge';

const NOT_GIVEN = '—';
const sectionClass = 'rounded-md border bg-card';
const titleClass = 'border-b px-5 py-4 font-heading text-lg font-semibold';

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

// Los datos del viaje que se cotiza y el proceso de la propuesta.
export function QuoteGeneralDetail({ quote }: { quote: QuoteDetail }) {
  const travelers =
    quote.minors === 0
      ? plural(quote.adults, 'adulto', 'adultos')
      : `${plural(quote.adults, 'adulto', 'adultos')} · ${plural(quote.minors, 'menor', 'menores')}`;

  return (
    <section aria-labelledby="quote-general-title" className={sectionClass}>
      <h2 id="quote-general-title" className={titleClass}>
        Datos generales
      </h2>
      <dl className="grid gap-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
        <DetailItem term="Destino">{quote.destination}</DetailItem>
        <DetailItem term="Origen">{quote.origin ?? NOT_GIVEN}</DetailItem>
        <DetailItem term="Fechas">{formatQuoteDates(quote)}</DetailItem>
        <DetailItem term="Viajeros">{travelers}</DetailItem>
        <DetailItem term="Vigente hasta">
          {formatShortDate(quote.valid_until)}
        </DetailItem>
        <DetailItem term="Estado">
          <QuoteStatusBadge quote={quote} />
        </DetailItem>
        <DetailItem term="% por defecto">
          {formatPercentage(quote.default_markup_percent)}
        </DetailItem>
        <DetailItem term="Enviada">
          {quote.sent_at ? formatDateTime(quote.sent_at) : NOT_GIVEN}
        </DetailItem>
        <DetailItem term="Respuesta del cliente">
          {quote.decided_at ? formatDateTime(quote.decided_at) : NOT_GIVEN}
        </DetailItem>
        <DetailItem
          term="Notas internas"
          className="sm:col-span-2 lg:col-span-3"
        >
          <span className="whitespace-pre-line">
            {quote.notes ?? NOT_GIVEN}
          </span>
        </DetailItem>
      </dl>
    </section>
  );
}

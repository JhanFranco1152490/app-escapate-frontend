import Link from 'next/link';

import { formatShortDate, formatTimeAgo } from '@/lib/format/dates';

import type { QuoteListItem } from '../api';
import { formatQuoteDates } from '../format';
import { QuoteStatusBadge } from './quote-status-badge';

const headerCell =
  'h-10.5 px-4 text-left font-mono text-[0.59375rem] font-normal tracking-[0.16em] text-muted-foreground uppercase';
// Por debajo de md cada fila es una tarjeta: mismo marcado, sin una segunda copia de los
// datos para celular.
const cell = 'px-4 md:h-13.5 md:py-2';
const subline =
  'block truncate font-mono text-[0.6875rem] text-muted-foreground';

const HEADERS = [
  'Cotización',
  'Cliente',
  'Destino y fechas',
  'Vigencia',
  'Estado',
  'Asesor',
];

export function QuotesTable({ quotes }: { quotes: QuoteListItem[] }) {
  return (
    <table className="w-full text-sm md:table-fixed">
      <colgroup className="max-md:hidden">
        <col className="w-[12%]" />
        <col />
        <col className="w-[24%]" />
        <col className="w-[12%]" />
        <col className="w-[12%]" />
        <col className="w-[14%]" />
      </colgroup>
      <thead className="bg-muted/60 max-md:sr-only">
        <tr>
          {HEADERS.map((header) => (
            <th key={header} scope="col" className={headerCell}>
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {quotes.map((quote) => (
          <tr
            key={quote.id}
            className="border-t max-md:flex max-md:flex-col max-md:gap-1.5 max-md:py-3.5"
          >
            <td className={`${cell} font-mono text-[0.75rem]`}>
              <Link
                href={`/cotizaciones/${quote.id}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {quote.code}
              </Link>
              <span className={subline}>{quote.travel_request.code}</span>
            </td>
            <td className={`${cell} min-w-0`}>
              <span className="block truncate font-medium">
                {quote.client.display_name}
              </span>
              <span className={subline}>
                Actualizada {formatTimeAgo(quote.updated_at)}
              </span>
            </td>
            <td className={`${cell} min-w-0`}>
              <span className="block truncate">{quote.destination}</span>
              <span className={subline}>{formatQuoteDates(quote)}</span>
            </td>
            <td className={`${cell} text-muted-foreground`}>
              {formatShortDate(quote.valid_until)}
            </td>
            <td className={cell}>
              <QuoteStatusBadge quote={quote} />
            </td>
            <td className={`${cell} truncate text-muted-foreground`}>
              {quote.created_by.full_name}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

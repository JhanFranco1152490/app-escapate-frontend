import Image from 'next/image';

import {
  formatDateRange,
  formatLongDate,
  formatShortDate,
} from '@/lib/format/dates';
import { formatMoney, formatPercentage } from '@/lib/format/money';

import type { QuoteDetail, QuoteItem } from '../api';
import { formatQuoteDates } from '../format';
import { QUALITY_LEVEL_LABELS } from '../quality-levels';
import { SERVICE_TYPE_LABELS } from '../service-options';

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

function itemDates(item: QuoteItem) {
  if (item.start_date && item.end_date)
    return formatDateRange(item.start_date, item.end_date);
  if (item.start_date) return formatShortDate(item.start_date);
  return null;
}

function ServiceList({
  items,
  pricePrefix,
}: {
  items: QuoteItem[];
  // Sin prefijo no se muestra el precio (los incluidos); con él, el de cada servicio.
  pricePrefix?: string;
}) {
  return (
    <ul className="divide-y border-y">
      {items.map((item) => {
        const dates = itemDates(item);
        return (
          <li key={item.id} className="flex justify-between gap-6 py-3">
            <div className="min-w-0">
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {SERVICE_TYPE_LABELS[item.service_type]}
                {item.quality_level &&
                  ` · ${QUALITY_LEVEL_LABELS[item.quality_level]}`}
                {dates && ` · ${dates}`}
              </p>
              {item.details && (
                <p className="mt-1 text-sm whitespace-pre-line">
                  {item.details}
                </p>
              )}
            </div>
            {pricePrefix !== undefined && item.sale_price !== null && (
              <p className="shrink-0 font-medium">
                {pricePrefix}
                {formatMoney(item.sale_price)}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex break-inside-avoid flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

// La propuesta tal como la recibe el cliente: los servicios sin su precio por separado (así
// no se cotizan uno por uno por fuera), el total, el valor por persona y las condiciones.
// Nunca muestra costos, márgenes ni comisiones.
export function QuoteDocument({ quote }: { quote: QuoteDetail }) {
  const alternative = (item: QuoteItem) => item.alternative_of_id !== null;
  const included = quote.items.filter(
    (item) => !item.is_optional && !alternative(item),
  );
  const optional = quote.items.filter(
    (item) => item.is_optional && !alternative(item),
  );
  const alternatives = quote.items.filter(alternative);
  const travelers =
    plural(quote.adults, 'adulto', 'adultos') +
    (quote.minors ? ` y ${plural(quote.minors, 'menor', 'menores')}` : '');
  const { totals } = quote;

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-md border bg-white p-8 text-neutral-900 print:max-w-none print:border-0 print:p-0">
      <header className="flex items-start justify-between gap-6 border-b pb-6">
        <Image
          src="/brand/escapate-logo-color.png"
          alt="Escápate, agencia de viajes"
          width={600}
          height={364}
          className="h-auto w-28"
        />
        <div className="text-right">
          <p className="font-mono text-xs tracking-[0.16em] uppercase">
            Cotización
          </p>
          <p className="font-heading text-2xl font-semibold">{quote.code}</p>
          <p className="text-sm">
            Válida hasta el {formatLongDate(quote.valid_until)}
          </p>
        </div>
      </header>

      <Block title={`Para ${quote.client.display_name}`}>
        <p>
          {quote.destination}
          {quote.origin && `, saliendo desde ${quote.origin}`} ·{' '}
          {formatQuoteDates(quote)} · {travelers}
        </p>
      </Block>

      <Block title="Incluye">
        {included.length ? <ServiceList items={included} /> : <p>—</p>}
      </Block>

      <section className="flex break-inside-avoid flex-col gap-1 rounded-md bg-neutral-100 p-5">
        <p className="text-sm">Valor total</p>
        <p className="font-heading text-3xl font-semibold">
          {formatMoney(totals.sale)}
        </p>
        {totals.per_person !== null && (
          <p className="text-sm">
            {formatMoney(totals.per_person)} por persona
          </p>
        )}
      </section>

      {optional.length > 0 && (
        <Block title="Servicios opcionales (se suman si los eliges)">
          <ServiceList items={optional} pricePrefix="+ " />
        </Block>
      )}

      {alternatives.length > 0 && (
        <Block title="Alternativas (en lugar de un servicio incluido)">
          <ServiceList items={alternatives} pricePrefix="" />
        </Block>
      )}

      <Block title="Condiciones">
        <ul className="flex flex-col gap-2 text-sm">
          {quote.deposit_percent && totals.deposit !== null && (
            <li>
              Abono para reservar: {formatPercentage(quote.deposit_percent)} (
              {formatMoney(totals.deposit)}).
            </li>
          )}
          {quote.balance_due_date && (
            <li>
              Saldo a más tardar el {formatLongDate(quote.balance_due_date)}.
            </li>
          )}
          {quote.payment_terms && (
            <li className="whitespace-pre-line">{quote.payment_terms}</li>
          )}
          {quote.policies && (
            <li className="whitespace-pre-line">{quote.policies}</li>
          )}
          <li>
            Precios sujetos a disponibilidad hasta la confirmación de la
            reserva. Esta propuesta vale hasta el{' '}
            {formatLongDate(quote.valid_until)}.
          </li>
        </ul>
      </Block>

      <footer className="border-t pt-4 text-xs text-muted-foreground">
        Preparada por {quote.created_by.full_name} · Escápate, agencia de viajes
      </footer>
    </article>
  );
}

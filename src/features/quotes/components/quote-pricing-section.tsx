'use client';

import { useState } from 'react';

import { Alert } from '@/components/alert';
import { DetailItem } from '@/components/detail-item';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useHasPermission } from '@/features/auth/permissions';
import { actionErrorMessage } from '@/lib/action-feedback';
import { formatMoney, formatPercentage } from '@/lib/format/money';
import { parseAmount } from '@/lib/validation/amount';
import { parsePercent, percentInput } from '@/lib/validation/percent';

import type { QuoteDetail } from '../api';
import { useUpdateQuotePricing } from '../mutations';

const sectionClass = 'rounded-md border bg-card';
const titleClass = 'border-b px-5 py-4 font-heading text-lg font-semibold';

// Lo que el backend calculó: costo, precio, ganancia y margen de los servicios incluidos.
function Totals({ quote }: { quote: QuoteDetail }) {
  const { totals } = quote;
  return (
    <dl className="grid gap-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4">
      <DetailItem term="Costo total">{formatMoney(totals.cost)}</DetailItem>
      <DetailItem term="Precio de venta">
        <span className="text-base font-semibold">
          {formatMoney(totals.sale)}
        </span>
      </DetailItem>
      <DetailItem term="Ganancia">
        {formatMoney(totals.profit)}
        {totals.margin_percent &&
          ` (${formatPercentage(totals.margin_percent)} del precio)`}
      </DetailItem>
      <DetailItem term="Por persona">
        {totals.per_person === null ? '—' : formatMoney(totals.per_person)}
      </DetailItem>
      <DetailItem term="Opcionales (aparte)">
        {formatMoney(totals.optional_sale)}
      </DetailItem>
      <DetailItem term="Abono para reservar">
        {totals.deposit === null ? '—' : formatMoney(totals.deposit)}
      </DetailItem>
      <DetailItem term="% por defecto">
        {formatPercentage(quote.default_markup_percent)}
      </DetailItem>
      <DetailItem term="Tasa del dólar">
        {quote.exchange_rate
          ? `${formatMoney(Math.round(Number(quote.exchange_rate)))} por USD`
          : 'Sin definir'}
      </DetailItem>
    </dl>
  );
}

// El % que reciben los servicios nuevos y la tasa con que se pasan a pesos los que están en
// dólares. Solo en borrador.
function PricingForm({ quote }: { quote: QuoteDetail }) {
  const update = useUpdateQuotePricing(quote.id);
  const [markup, setMarkup] = useState(
    percentInput(quote.default_markup_percent),
  );
  const [rate, setRate] = useState(
    quote.exchange_rate ? quote.exchange_rate.replace('.', ',') : '',
  );
  const [error, setError] = useState<string>();

  const save = () => {
    const markupValue = parsePercent(markup, { min: 0, max: 999.99 });
    const rateValue = rate.trim() ? parseAmount(rate, 'USD') : null;
    if ('error' in markupValue) return setError(markupValue.error);
    if (rateValue && 'error' in rateValue) return setError(rateValue.error);
    setError(undefined);
    update.mutate(
      {
        default_markup_percent: markupValue.value,
        exchange_rate: rateValue?.value ?? null,
        expected_version: quote.version,
      },
      { onError: (failure) => setError(actionErrorMessage(failure)) },
    );
  };

  return (
    <div className="flex flex-col gap-3 border-t px-5 py-5">
      {error && <Alert title={error} />}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="pricing-markup">% por defecto</Label>
          <Input
            id="pricing-markup"
            inputMode="decimal"
            className="h-11 w-32"
            value={markup}
            onChange={(event) => setMarkup(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pricing-rate">Pesos por dólar</Label>
          <Input
            id="pricing-rate"
            inputMode="decimal"
            placeholder="4.050,25"
            className="h-11 w-40"
            value={rate}
            onChange={(event) => setRate(event.target.value)}
          />
        </div>
        <Button variant="outline" onClick={save} disabled={update.isPending}>
          {update.isPending ? 'Guardando…' : 'Guardar precio'}
        </Button>
      </div>
      <p className="text-[0.78125rem] text-muted-foreground">
        El % por defecto se aplica a los servicios que agregues después; cada
        servicio puede tener el suyo.
      </p>
    </div>
  );
}

export function QuotePricingSection({ quote }: { quote: QuoteDetail }) {
  const canManage = useHasPermission('quotes.manage');
  return (
    <section aria-labelledby="quote-pricing-title" className={sectionClass}>
      <h2 id="quote-pricing-title" className={titleClass}>
        Precio
      </h2>
      {quote.totals.missing_exchange_rate && (
        <div className="px-5 pt-4">
          <Alert title="Hay servicios en dólares y falta la tasa de cambio.">
            <p>Mientras no la definas, esos servicios no suman al precio.</p>
          </Alert>
        </div>
      )}
      <Totals quote={quote} />
      {canManage && quote.status === 'draft' && (
        <PricingForm key={quote.version} quote={quote} />
      )}
    </section>
  );
}

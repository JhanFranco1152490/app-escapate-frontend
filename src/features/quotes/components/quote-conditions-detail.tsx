import { DetailItem } from '@/components/detail-item';
import { formatShortDate } from '@/lib/format/dates';
import { formatPercentage } from '@/lib/format/money';

import type { QuoteDetail } from '../api';

const NOT_GIVEN = '—';
const sectionClass = 'rounded-md border bg-card';
const titleClass = 'border-b px-5 py-4 font-heading text-lg font-semibold';

// Abono, saldo, forma de pago y políticas: lo que el cliente lee al final de la propuesta.
export function QuoteConditionsDetail({ quote }: { quote: QuoteDetail }) {
  return (
    <section aria-labelledby="quote-conditions-title" className={sectionClass}>
      <h2 id="quote-conditions-title" className={titleClass}>
        Condiciones comerciales
      </h2>
      <dl className="grid gap-5 px-5 py-5 sm:grid-cols-2">
        <DetailItem term="Abono para reservar">
          {quote.deposit_percent
            ? formatPercentage(quote.deposit_percent)
            : NOT_GIVEN}
        </DetailItem>
        <DetailItem term="Fecha límite del saldo">
          {quote.balance_due_date
            ? formatShortDate(quote.balance_due_date)
            : NOT_GIVEN}
        </DetailItem>
        <DetailItem term="Forma de pago" className="sm:col-span-2">
          <span className="whitespace-pre-line">
            {quote.payment_terms ?? NOT_GIVEN}
          </span>
        </DetailItem>
        <DetailItem term="Políticas y restricciones" className="sm:col-span-2">
          <span className="whitespace-pre-line">
            {quote.policies ?? NOT_GIVEN}
          </span>
        </DetailItem>
      </dl>
    </section>
  );
}

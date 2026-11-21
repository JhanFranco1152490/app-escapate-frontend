'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Alert } from '@/components/alert';
import { ButtonLink } from '@/components/button-link';
import { DetailItem } from '@/components/detail-item';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { RecordLoader } from '@/components/record-loader';
import { Button } from '@/components/ui/button';
import { useHasPermission } from '@/features/auth/permissions';
import {
  formatDateRange,
  formatDay,
  formatShortDate,
} from '@/lib/format/dates';
import { formatMoney } from '@/lib/format/money';
import { parseRouteId } from '@/lib/route-id';
import { usePageNotice } from '@/lib/use-page-notice';

import { useRemovePayment, useSale, type SaleDetail } from '../api';
import { PAYMENT_METHOD_LABELS } from '../labels';
import { AddPaymentForm } from './add-payment-form';
import { PaymentStatusBadge } from './payment-status-badge';
import { SaleBookingsSection } from './sale-bookings-section';

const sectionClass = 'rounded-md border bg-card';
const titleClass = 'border-b px-5 py-4 font-heading text-lg font-semibold';

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

export const saleNoticeTarget = (id: number) => `sale:${id}`;

function TripSection({ sale }: { sale: SaleDetail }) {
  const dates =
    sale.departure_date && sale.return_date
      ? formatDateRange(sale.departure_date, sale.return_date)
      : sale.departure_date
        ? formatShortDate(sale.departure_date)
        : 'Sin fechas';
  return (
    <section className={sectionClass} aria-labelledby="sale-trip-title">
      <h2 id="sale-trip-title" className={titleClass}>
        Viaje vendido
      </h2>
      <dl className="grid gap-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4">
        <DetailItem term="Destino">{sale.destination}</DetailItem>
        <DetailItem term="Fechas">{dates}</DetailItem>
        <DetailItem term="Viajeros">
          {plural(sale.adults, 'adulto', 'adultos')}
          {sale.minors > 0 && ` · ${plural(sale.minors, 'menor', 'menores')}`}
        </DetailItem>
        <DetailItem term="Cotización">
          <Link
            href={`/cotizaciones/${sale.quote.id}`}
            className="underline-offset-4 hover:underline"
          >
            {sale.quote.code}
          </Link>
        </DetailItem>
        <DetailItem term="Notas" className="sm:col-span-2 lg:col-span-4">
          <span className="whitespace-pre-line">{sale.notes ?? '—'}</span>
        </DetailItem>
      </dl>
    </section>
  );
}

function PaymentsSection({ sale }: { sale: SaleDetail }) {
  const canManage = useHasPermission('sales.manage');
  const remove = useRemovePayment(sale.id);
  const [feedback, setFeedback] = useState<string>();
  const paidShare = Math.min(100, (sale.paid / sale.total_price) * 100);

  return (
    <section className={sectionClass} aria-labelledby="sale-payments-title">
      <h2 id="sale-payments-title" className={titleClass}>
        Pagos del cliente
      </h2>
      <dl className="grid gap-5 px-5 py-5 sm:grid-cols-3">
        <DetailItem term="Total vendido">
          {formatMoney(sale.total_price)}
        </DetailItem>
        <DetailItem term="Pagado">{formatMoney(sale.paid)}</DetailItem>
        <DetailItem term="Saldo">
          <span className="text-base font-semibold">
            {formatMoney(sale.balance)}
          </span>
        </DetailItem>
      </dl>
      <div className="px-5 pb-5">
        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Pagado del total"
          aria-valuenow={Math.round(paidShare)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-[rgb(var(--ok))]"
            style={{ width: `${paidShare}%` }}
          />
        </div>
      </div>
      {feedback && (
        <div className="px-5 pb-4">
          <Alert variant="info" title={feedback} />
        </div>
      )}
      {sale.payments.length === 0 ? (
        <p className="border-t px-5 py-5 text-sm text-muted-foreground">
          Todavía no hay pagos registrados.
        </p>
      ) : (
        <ul className="divide-y border-t">
          {sale.payments.map((payment) => (
            <li
              key={payment.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm"
            >
              <span className="font-medium">{formatMoney(payment.amount)}</span>
              <span className="text-muted-foreground">
                {formatShortDate(payment.paid_on)} ·{' '}
                {PAYMENT_METHOD_LABELS[payment.method]}
                {payment.reference && ` · ${payment.reference}`}
              </span>
              <span className="text-muted-foreground">
                {payment.created_by.full_name}
              </span>
              {canManage && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={remove.isPending}
                  aria-label={`Quitar el pago de ${formatMoney(payment.amount)}`}
                  onClick={() =>
                    remove.mutate(payment.id, {
                      onSuccess: () => setFeedback('Pago quitado.'),
                    })
                  }
                >
                  Quitar
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canManage && sale.balance > 0 && (
        <AddPaymentForm
          saleId={sale.id}
          onDone={() => setFeedback('Pago registrado.')}
        />
      )}
    </section>
  );
}

export function SaleDetailScreen({ id }: { id: string }) {
  const saleId = parseRouteId(id);
  const pageNotice = usePageNotice(saleNoticeTarget(saleId ?? 0));
  return (
    <RecordLoader
      validId={saleId !== null}
      query={useSale(saleId)}
      back={{ href: '/ventas', label: 'Ventas y pagos' }}
      notFound={
        <EmptyState
          title="No encontramos esta venta"
          action={
            <ButtonLink href="/ventas" variant="outline">
              Volver a ventas
            </ButtonLink>
          }
        >
          Puede que el enlace esté mal escrito.
        </EmptyState>
      }
      errorTitle="No pudimos cargar la venta"
      loadingLabel="Cargando la venta"
    >
      {(sale) => (
        <>
          <PageHeader
            eyebrow="Operación / 08"
            title={`Venta ${sale.code}`}
            description={`${sale.client.display_name} · Registrada el ${formatDay(sale.created_at)} por ${sale.created_by.full_name}`}
          />
          <div>
            <PaymentStatusBadge status={sale.payment_status} />
          </div>
          {pageNotice && <Alert variant="info" title={pageNotice} />}
          <TripSection sale={sale} />
          <PaymentsSection sale={sale} />
          <SaleBookingsSection saleId={sale.id} />
        </>
      )}
    </RecordLoader>
  );
}

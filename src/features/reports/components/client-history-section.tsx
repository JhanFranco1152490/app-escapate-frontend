'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { DetailItem } from '@/components/detail-item';
import { useHasPermission } from '@/features/auth/permissions';
import { apiFetch } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { components } from '@/lib/api/schema';
import { formatDateTime, formatDay } from '@/lib/format/dates';
import { formatMoney } from '@/lib/format/money';
import { parseRouteId } from '@/lib/route-id';

type ClientHistory = components['schemas']['ClientHistory'];
type HistoryEvent = components['schemas']['HistoryEvent'];

const KIND: Record<
  HistoryEvent['kind'],
  { label: string; href: (id: number) => string; permission: string }
> = {
  request: {
    label: 'Solicitud',
    href: (id) => `/solicitudes/${id}`,
    permission: 'travel_requests.view',
  },
  quote: {
    label: 'Cotización',
    href: (id) => `/cotizaciones/${id}`,
    permission: 'quotes.view',
  },
  sale: {
    label: 'Venta',
    href: (id) => `/ventas/${id}`,
    permission: 'sales.view',
  },
  payment: {
    label: 'Pago',
    href: (id) => `/ventas/${id}`,
    permission: 'sales.view',
  },
};

const STATUS_TEXT: Record<string, string> = {
  new: 'Nueva',
  quoting: 'En cotización',
  quoted: 'Cotizada',
  closed: 'Cerrada',
  draft: 'Borrador',
  sent: 'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  expired: 'Vencida',
  pending: 'Sin pagos',
  partial: 'Con abonos',
  paid: 'Pagada',
  transfer: 'Transferencia',
  cash: 'Efectivo',
  card: 'Tarjeta',
  other: 'Otro',
};

function EventRow({ event }: { event: HistoryEvent }) {
  const kind = KIND[event.kind];
  const canOpen = useHasPermission(kind.permission);
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
      <span className="w-40 shrink-0 text-muted-foreground">
        {event.kind === 'payment'
          ? formatDay(event.at)
          : formatDateTime(event.at)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="mr-2 font-mono text-[0.625rem] tracking-[0.12em] text-orange-600 uppercase">
          {kind.label}
        </span>
        {canOpen ? (
          <Link
            href={kind.href(event.record_id)}
            className="font-medium underline-offset-4 hover:underline"
          >
            {event.title}
          </Link>
        ) : (
          <span className="font-medium">{event.title}</span>
        )}
        <span className="ml-2 font-mono text-[0.75rem] text-muted-foreground">
          {event.code}
        </span>
      </span>
      {event.status && (
        <span className="text-muted-foreground">
          {STATUS_TEXT[event.status] ?? event.status}
        </span>
      )}
      {event.amount !== null && (
        <span className="font-medium tabular-nums">
          {formatMoney(event.amount)}
        </span>
      )}
    </li>
  );
}

// Todo lo que el cliente ha hecho con la agencia, de lo más reciente a lo más viejo.
export function ClientHistorySection({ id }: { id: string }) {
  const clientId = parseRouteId(id);
  const history = useQuery({
    queryKey: queryKeys.reports.clientHistory(clientId ?? 0),
    queryFn: () =>
      apiFetch<ClientHistory>(`/api/reports/clients/${clientId}/history`),
    enabled: clientId !== null,
  });
  const data = history.data;
  if (!data) return null;

  return (
    <section
      aria-labelledby="client-history-title"
      className="rounded-md border bg-card"
    >
      <h2
        id="client-history-title"
        className="border-b px-5 py-4 font-heading text-lg font-semibold"
      >
        Historial del cliente
      </h2>
      <dl className="grid gap-5 px-5 py-5 sm:grid-cols-3 lg:grid-cols-6">
        <DetailItem term="Solicitudes">{data.requests}</DetailItem>
        <DetailItem term="Cotizaciones">{data.quotes}</DetailItem>
        <DetailItem term="Viajes comprados">{data.sales}</DetailItem>
        <DetailItem term="Total comprado">
          {formatMoney(data.total_bought)}
        </DetailItem>
        <DetailItem term="Pagado">{formatMoney(data.total_paid)}</DetailItem>
        <DetailItem term="Saldo pendiente">
          <span className="font-semibold">{formatMoney(data.balance)}</span>
        </DetailItem>
      </dl>
      {data.events.length === 0 ? (
        <p className="border-t px-5 py-5 text-sm text-muted-foreground">
          Este cliente todavía no tiene solicitudes ni compras.
        </p>
      ) : (
        <ul className="divide-y border-t">
          {data.events.map((event) => (
            <EventRow
              key={`${event.kind}-${event.record_id}-${event.at}`}
              event={event}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

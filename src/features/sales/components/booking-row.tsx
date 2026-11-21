'use client';

import Link from 'next/link';
import { useState } from 'react';

import { StatusBadge, type StatusTone } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { useHasPermission } from '@/features/auth/permissions';
import { formatDateRange, formatShortDate } from '@/lib/format/dates';

import {
  useUpdateBooking,
  type Booking,
  type BookingStatus,
} from '../booking-api';
import { bookingRequestText } from '../booking-request';

export const BOOKING_STATUS: Record<
  BookingStatus,
  { label: string; tone: StatusTone }
> = {
  to_request: { label: 'Por solicitar', tone: 'pending' },
  requested: { label: 'Solicitada', tone: 'pending' },
  confirmed: { label: 'Confirmada', tone: 'ok' },
  cancelled: { label: 'Cancelada', tone: 'inactive' },
};

// Una reserva: qué se reserva, con quién, y su estado. Desde aquí se copia el texto de la
// solicitud para el proveedor y se registra la confirmación.
export function BookingRow({
  booking,
  showSale,
}: {
  booking: Booking;
  showSale?: boolean;
}) {
  const canManage = useHasPermission('sales.manage');
  const update = useUpdateBooking();
  const [status, setStatus] = useState(booking.status);
  const [code, setCode] = useState(booking.confirmation_code ?? '');
  const [copied, setCopied] = useState(false);
  const dates =
    booking.start_date && booking.end_date
      ? formatDateRange(booking.start_date, booking.end_date)
      : booking.start_date
        ? formatShortDate(booking.start_date)
        : 'Sin fechas';
  const contact =
    booking.supplier?.contact_email ?? booking.supplier?.contact_phone;

  const copy = async () => {
    await navigator.clipboard.writeText(bookingRequestText(booking));
    setCopied(true);
  };

  return (
    <li className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-medium">{booking.name}</span>
          <StatusBadge {...BOOKING_STATUS[booking.status]} />
        </div>
        <p className="text-xs text-muted-foreground">
          {dates} · Cantidad {booking.quantity}
          {booking.supplier
            ? ` · ${booking.supplier.trade_name}${contact ? ` (${contact})` : ''}`
            : ' · Proveedor por definir'}
          {booking.confirmation_code &&
            ` · Confirmación ${booking.confirmation_code}`}
        </p>
        {showSale && (
          <Link
            href={`/ventas/${booking.sale.id}`}
            className="font-mono text-[0.75rem] underline-offset-4 hover:underline"
          >
            {booking.sale.code} · {booking.sale.destination}
          </Link>
        )}
      </div>
      {canManage && (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => void copy()}>
            {copied ? 'Copiada' : 'Copiar solicitud'}
          </Button>
          <NativeSelect
            size="sm"
            aria-label={`Estado de ${booking.name}`}
            value={status}
            onChange={(event) => setStatus(event.target.value as BookingStatus)}
          >
            {Object.entries(BOOKING_STATUS).map(([value, { label }]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Input
            aria-label={`Código de confirmación de ${booking.name}`}
            placeholder="Código de confirmación"
            maxLength={60}
            className="h-9 w-44"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <Button
            size="sm"
            disabled={update.isPending}
            onClick={() =>
              update.mutate({
                id: booking.id,
                body: {
                  status,
                  confirmation_code: code.trim() || null,
                  notes: booking.notes,
                },
              })
            }
          >
            Guardar
          </Button>
        </div>
      )}
    </li>
  );
}

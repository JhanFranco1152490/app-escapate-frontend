'use client';

import { Alert } from '@/components/alert';
import { Button } from '@/components/ui/button';
import { useHasPermission } from '@/features/auth/permissions';
import { actionErrorMessage } from '@/lib/action-feedback';

import { useBookings, usePrepareBookings } from '../booking-api';
import { BookingRow } from './booking-row';

// Las reservas de los servicios vendidos. "Preparar solicitudes" crea una por servicio
// incluido; se puede repetir sin duplicar.
export function SaleBookingsSection({ saleId }: { saleId: number }) {
  const canManage = useHasPermission('sales.manage');
  const bookings = useBookings({ status: null, saleId, page: 1 });
  const prepare = usePrepareBookings(saleId);
  const rows = bookings.data?.results ?? [];
  const confirmed = rows.filter((row) => row.status === 'confirmed').length;

  return (
    <section
      aria-labelledby="sale-bookings-title"
      className="rounded-md border bg-card"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <h2
          id="sale-bookings-title"
          className="font-heading text-lg font-semibold"
        >
          Reservas
          {rows.length > 0 && (
            <span className="ml-3 text-sm font-normal text-muted-foreground">
              {confirmed} de {rows.length} confirmadas
            </span>
          )}
        </h2>
        {canManage && (
          <Button
            variant="outline"
            disabled={prepare.isPending}
            onClick={() => prepare.mutate()}
          >
            Preparar solicitudes de reserva
          </Button>
        )}
      </header>
      {prepare.isError && (
        <div className="px-5 pt-4">
          <Alert title={actionErrorMessage(prepare.error)} />
        </div>
      )}
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">
          {bookings.isPending
            ? 'Cargando…'
            : 'Todavía no hay reservas. Prepáralas a partir de los servicios vendidos.'}
        </p>
      ) : (
        <ul className="divide-y">
          {rows.map((booking) => (
            <BookingRow
              key={`${booking.id}-${booking.status}`}
              booking={booking}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

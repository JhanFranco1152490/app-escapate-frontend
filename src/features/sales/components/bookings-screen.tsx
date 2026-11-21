'use client';

import { parseAsStringLiteral, useQueryState } from 'nuqs';

import { EmptyState } from '@/components/empty-state';
import { FilterTabs } from '@/components/filter-tabs';
import { PageHeader } from '@/components/page-header';
import { TableSkeleton } from '@/components/table-skeleton';

import { useBookings, type BookingStatus } from '../booking-api';
import { BookingRow } from './booking-row';

const STATUSES = ['to_request', 'requested', 'confirmed', 'cancelled'] as const;

const TABS: { label: string; value: BookingStatus | null }[] = [
  { label: 'Por solicitar', value: 'to_request' },
  { label: 'Solicitadas', value: 'requested' },
  { label: 'Confirmadas', value: 'confirmed' },
  { label: 'Canceladas', value: 'cancelled' },
  { label: 'Todas', value: null },
];

// Las reservas de todas las ventas, por estado: lo que falta pedir primero.
export function BookingsScreen() {
  const [status, setStatus] = useQueryState(
    'status',
    parseAsStringLiteral(STATUSES).withDefault('to_request'),
  );
  const bookings = useBookings({ status, saleId: null, page: 1 });

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Operación / 09"
        title="Reservas"
        description="Los servicios vendidos que hay que reservar con los proveedores y su confirmación."
      />
      <div className="overflow-x-auto">
        <FilterTabs
          label="Estado de la reserva"
          tabs={TABS}
          value={status}
          onChange={(value) => void setStatus(value)}
        />
      </div>
      {bookings.data?.results.length === 0 ? (
        <EmptyState title="Nada por aquí">
          No hay reservas en este estado.
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-md border bg-card">
          {bookings.data ? (
            <ul className="divide-y">
              {bookings.data.results.map((booking) => (
                <BookingRow
                  key={`${booking.id}-${booking.status}`}
                  booking={booking}
                  showSale
                />
              ))}
            </ul>
          ) : (
            <TableSkeleton label="Cargando reservas" />
          )}
        </div>
      )}
    </div>
  );
}

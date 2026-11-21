import { formatDateRange, formatShortDate } from '@/lib/format/dates';

import type { Booking } from './booking-api';

// El texto de la solicitud de reserva que se le envía al proveedor (por correo o WhatsApp).
export function bookingRequestText(booking: Booking) {
  const dates =
    booking.start_date && booking.end_date
      ? formatDateRange(booking.start_date, booking.end_date)
      : booking.start_date
        ? formatShortDate(booking.start_date)
        : 'fechas por confirmar';
  const lines = [
    booking.supplier ? `Hola, ${booking.supplier.trade_name}.` : 'Hola.',
    `Desde Escápate queremos solicitar la reserva de: ${booking.name}.`,
    `Fechas: ${dates}. Cantidad: ${booking.quantity}.`,
    booking.details ? `Detalle: ${booking.details}` : null,
    `Referencia de la agencia: ${booking.sale.code}.`,
    'Quedamos atentos a la confirmación. Gracias.',
  ];
  return lines.filter(Boolean).join('\n');
}

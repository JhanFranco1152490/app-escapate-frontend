import {
  formatDateRange,
  formatDayMonth,
  formatShortDate,
} from '@/lib/format/dates';

import type { TravelRequestListItem } from './api';

type TripDates = Pick<
  TravelRequestListItem,
  | 'date_mode'
  | 'departure_date'
  | 'return_date'
  | 'window_start'
  | 'window_end'
  | 'approx_nights'
>;

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

// "Entre 1 dic y 31 dic 2026": el año se dice una sola vez si las dos fechas lo comparten.
function formatWindow(start: string, end: string) {
  const startText =
    start.slice(0, 4) === end.slice(0, 4)
      ? formatDayMonth(start)
      : formatShortDate(start);
  return `Entre ${startText} y ${formatShortDate(end)}`;
}

// Las fechas del viaje en una línea, según el modo:
// "18–24 dic 2026", "Salida 18 dic 2026" o "Entre 1 dic y 31 dic 2026 · ~5 noches".
export function formatTripDates(request: TripDates) {
  if (request.date_mode === 'exact') {
    const departure = request.departure_date!;
    return request.return_date
      ? formatDateRange(departure, request.return_date)
      : `Salida ${formatShortDate(departure)}`;
  }
  const window = formatWindow(request.window_start!, request.window_end!);
  return request.approx_nights
    ? `${window} · ~${plural(request.approx_nights, 'noche', 'noches')}`
    : window;
}

// Cuándo sale el viaje, para "Por cotizar": la salida exacta o el inicio del período.
export function formatDeparture(request: TripDates) {
  return request.date_mode === 'exact'
    ? formatShortDate(request.departure_date!)
    : `Desde ${formatShortDate(request.window_start!)}`;
}

// Días de espera desde que se registró: "Hoy", "1 día", "6 días".
export const formatWaiting = (days: number) =>
  days === 0 ? 'Hoy' : plural(days, 'día', 'días');

// "2 adultos · 1 menor"; sin menores, solo los adultos.
export function formatTravelers(adults: number, minors: number) {
  const adultsText = plural(adults, 'adulto', 'adultos');
  return minors === 0
    ? adultsText
    : `${adultsText} · ${plural(minors, 'menor', 'menores')}`;
}

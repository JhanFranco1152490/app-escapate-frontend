import { formatDateRange, formatShortDate } from '@/lib/format/dates';

import type { QuoteListItem } from './api';

type QuoteDates = Pick<QuoteListItem, 'departure_date' | 'return_date'>;

// "18–24 dic 2026", "Salida 18 dic 2026" o "Sin fechas" mientras el asesor no las define.
export function formatQuoteDates({ departure_date, return_date }: QuoteDates) {
  if (departure_date && return_date) {
    return formatDateRange(departure_date, return_date);
  }
  if (departure_date) return `Salida ${formatShortDate(departure_date)}`;
  return 'Sin fechas';
}

// Desde la ruta de la ficha hacia el aviso que la ficha muestra al llegar.
export const quoteNoticeTarget = (id: number) => `quote:${id}`;

import { todayInBogota } from '@/lib/format/dates';

const OLDEST_DATE = '1900-01-01';

// Fecha de nacimiento (yyyy-MM-dd): no futura según el día de Bogotá y no anterior a 1900,
// con los mismos mensajes que la API. Vacía no es asunto de esta regla.
export function pastDateError(value: string) {
  if (!value) return undefined;
  if (value > todayInBogota()) return 'La fecha no puede ser futura.';
  if (value < OLDEST_DATE) return 'Revisa el año.';
  return undefined;
}

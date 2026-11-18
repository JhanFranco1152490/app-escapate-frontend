import { differenceInCalendarDays, parseISO } from 'date-fns';

// Mismos mensajes que la API.
export const DEPARTURE_REQUIRED = 'Indica la fecha de salida.';
export const START_REQUIRED = 'Indica desde cuándo.';
export const END_REQUIRED = 'Indica hasta cuándo.';
const BEFORE_DEPARTURE = 'No puede ser anterior a la salida.';
const BEFORE_START = 'No puede ser anterior al inicio.';
const NIGHTS_DO_NOT_FIT = 'No caben en el período elegido.';
const DATE_IN_PAST = 'La fecha ya pasó.';
const NIGHTS_RANGE = 'Indica un número entero de 1 a 365.';

export type TripDateValues = {
  date_mode: 'exact' | 'flexible';
  departure_date: string;
  return_date: string;
  window_start: string;
  window_end: string;
  approx_nights: string;
};

// La fecha que no puede quedar en el pasado, tal como se guardó: al editar solo se vuelve a
// revisar si cambió, para poder corregir otros datos de un viaje que ya empezó.
export type OriginalDates = {
  departure_date: string | null;
  window_end: string | null;
};

type DateErrors = Partial<Record<keyof TripDateValues, string>>;

export const parseInteger = (text: string, min: number, max: number) => {
  const value = text.trim();
  if (!/^\d{1,3}$/.test(value)) return undefined;
  const number = Number(value);
  return number >= min && number <= max ? number : undefined;
};

// Las fechas llegan como yyyy-MM-dd: compararlas como texto da el orden correcto.
export function tripDateErrors(
  values: TripDateValues,
  today: string,
  original?: OriginalDates,
): DateErrors {
  const inPast = (field: keyof OriginalDates) => {
    const value = values[field];
    return value < today && original?.[field] !== value
      ? DATE_IN_PAST
      : undefined;
  };

  if (values.date_mode === 'exact') {
    const { departure_date: departure, return_date: back } = values;
    return {
      departure_date: departure ? inPast('departure_date') : DEPARTURE_REQUIRED,
      return_date:
        departure && back && back < departure ? BEFORE_DEPARTURE : undefined,
    };
  }

  const { window_start: start, window_end: end } = values;
  const nightsText = values.approx_nights.trim();
  const nights = parseInteger(nightsText, 1, 365);
  const windowDays =
    start && end && end >= start
      ? differenceInCalendarDays(parseISO(end), parseISO(start))
      : undefined;
  return {
    window_start: start ? undefined : START_REQUIRED,
    window_end: !end
      ? END_REQUIRED
      : start && end < start
        ? BEFORE_START
        : inPast('window_end'),
    approx_nights: !nightsText
      ? undefined
      : nights === undefined
        ? NIGHTS_RANGE
        : windowDays !== undefined && nights > windowDays
          ? NIGHTS_DO_NOT_FIT
          : undefined,
  };
}

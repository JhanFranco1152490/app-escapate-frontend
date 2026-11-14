import { tz } from '@date-fns/tz';
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const BOGOTA = tz('America/Bogota');

// "Hoy" en la zona del negocio: cerca de la medianoche UTC el día de Bogotá aún es el anterior.
export const todayInBogota = () =>
  format(new Date(), 'yyyy-MM-dd', { in: BOGOTA });

// Años cumplidos el día `day` por alguien nacido en `birthDate` (los dos yyyy-MM-dd, sin
// zona horaria). Quien nació un 29 de febrero los cumple el 1 de marzo en los años no
// bisiestos, igual que en la API.
export function ageOn(birthDate: string, day: string) {
  const [birthYear, birthMonthDay] = [
    birthDate.slice(0, 4),
    birthDate.slice(5),
  ];
  const [year, monthDay] = [day.slice(0, 4), day.slice(5)];
  const birthdayPassed = monthDay >= birthMonthDay;
  return Number(year) - Number(birthYear) - (birthdayPassed ? 0 : 1);
}

// Momento exacto (ISO con zona) mostrado con la hora de Bogotá.
export const formatDateTime = (isoDateTime: string) =>
  format(parseISO(isoDateTime), "d 'de' MMMM 'de' yyyy, h:mm aaaa", {
    locale: es,
    in: BOGOTA,
  });

// Versión corta para tablas, donde la larga no cabe.
export const formatShortDateTime = (isoDateTime: string) =>
  format(parseISO(isoDateTime), 'd MMM yyyy, h:mm aaaa', {
    locale: es,
    in: BOGOTA,
  });

// Recibe una fecha sin hora (yyyy-MM-dd) y no la desplaza por zona horaria.
export const formatLongDate = (isoDate: string) =>
  format(parseISO(isoDate), "d 'de' MMMM 'de' yyyy", { locale: es });

// El día de un momento exacto (ISO con zona), según Bogotá: pasada la medianoche UTC el día de
// la agencia aún es el anterior.
export const formatDay = (isoDateTime: string) =>
  format(parseISO(isoDateTime), "d 'de' MMMM 'de' yyyy", {
    locale: es,
    in: BOGOTA,
  });

// Fecha sin hora (yyyy-MM-dd) en corto, para tablas: "15 dic 2026".
export const formatShortDate = (isoDate: string) =>
  format(parseISO(isoDate), 'd MMM yyyy', { locale: es });

// Dos fechas sin hora (yyyy-MM-dd) en corto, sin repetir el mes o el año que comparten:
// "18–24 dic 2026", "28 nov – 3 dic 2026", "28 dic 2026 – 3 ene 2027".
export function formatDateRange(start: string, end: string) {
  if (start === end) return formatShortDate(start);
  const short = (isoDate: string, pattern: string) =>
    format(parseISO(isoDate), pattern, { locale: es });
  if (start.slice(0, 7) === end.slice(0, 7)) {
    return `${short(start, 'd')}–${formatShortDate(end)}`;
  }
  if (start.slice(0, 4) === end.slice(0, 4)) {
    return `${short(start, 'd MMM')} – ${formatShortDate(end)}`;
  }
  return `${formatShortDate(start)} – ${formatShortDate(end)}`;
}

// Cuánto pasó desde un momento exacto (ISO con zona): "hace 5 minutos", "hace 2 días". Por
// debajo de un minuto, "hace un momento", para no mostrar segundos que cambian al instante.
export function formatTimeAgo(isoDateTime: string) {
  const moment = parseISO(isoDateTime);
  if (Date.now() - moment.getTime() < 60_000) return 'hace un momento';
  return formatDistanceToNowStrict(moment, { locale: es, addSuffix: true });
}

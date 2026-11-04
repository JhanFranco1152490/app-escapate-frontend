import { tz } from '@date-fns/tz';
import { format, parseISO } from 'date-fns';
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

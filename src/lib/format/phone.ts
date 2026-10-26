// La versión completa de los datos de la librería: la mínima solo revisa la longitud y el
// comienzo del número, y aceptaría números que la API rechaza (un celular colombiano que
// empieza por 380, por ejemplo). Pesa más, pero solo la cargan las pantallas que la usan.
import {
  parsePhoneNumberFromString,
  type CountryCode as PhoneCountry,
} from 'libphonenumber-js/max';

export type { PhoneCountry };

export const DEFAULT_PHONE_COUNTRY: PhoneCountry = 'CO';

// El número en formato E.164 (+573001112233), o null si no es válido para ese país. Si la
// persona lo escribe con su indicativo (+58 ...), manda el indicativo y no el país elegido.
export function toE164(number: string, country: PhoneCountry) {
  const phone = parsePhoneNumberFromString(number, country);
  return phone?.isValid() ? phone.number : null;
}

// País y número nacional de un E.164 guardado, para llenar el formulario de edición. En un
// indicativo compartido (+1) el país sale del código de área.
export function splitPhone(e164: string) {
  const phone = parsePhoneNumberFromString(e164);
  return {
    country: phone?.country ?? DEFAULT_PHONE_COUNTRY,
    number: phone?.nationalNumber ?? e164,
  };
}

// Colombia en formato nacional y en grupos de 3, 3 y 4 (como se dicta un celular); la
// librería lo agruparía como "300 1112233". Los demás países, con su indicativo.
export function formatPhone(e164: string) {
  const phone = parsePhoneNumberFromString(e164);
  if (!phone) return e164;
  const national = phone.nationalNumber;
  if (phone.country === 'CO' && national.length === 10) {
    return `${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
  }
  return phone.formatInternational();
}

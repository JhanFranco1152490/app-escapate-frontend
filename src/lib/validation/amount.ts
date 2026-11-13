import type { components } from '@/lib/api/schema';

export type Currency = components['schemas']['Currency'];

export const AMOUNT_REQUIRED_MESSAGE = 'Indica el valor de la tarifa.';
export const AMOUNT_FORMAT_MESSAGE =
  'Escribe el valor como 1.250,50 (punto para miles, coma para centavos).';
export const NOT_POSITIVE_MESSAGE = 'Indica un valor mayor que cero.';
// El mismo mensaje de la API.
export const CENTS_IN_PESOS_MESSAGE = 'En pesos el valor va sin decimales.';
export const AMOUNT_TOO_LARGE_MESSAGE = 'El valor es demasiado grande.';

const MAX_WHOLE_DIGITS = 12;

// Formato colombiano: los miles con punto, en grupos de tres, o sin separar; los centavos con
// coma. Lo que se puede leer de dos formas no se acepta: en el formato de Estados Unidos
// "1,250" son mil doscientos cincuenta y aquí sería uno con veinticinco, así que tres cifras
// después de la coma o un punto sin tres cifras detrás son un error, no una suposición.
const COLOMBIAN_AMOUNT = /^(\d+|\d{1,3}(?:\.\d{3})+)(?:,(\d{1,2}))?$/;
// Quien copia el valor de una cotización del proveedor suele traer el símbolo.
const CURRENCY_SYMBOL = /^(US)?\$\s*/;

export type ParsedAmount = { value: string } | { error: string };

// Del texto que escribe la persona a la cadena decimal que espera la API: "710000" en pesos,
// "1250.50" en dólares. Nunca pasa por un número, para no perder centavos.
export function parseAmount(text: string, currency: Currency): ParsedAmount {
  const cleaned = text.trim().replace(CURRENCY_SYMBOL, '');
  if (!cleaned) return { error: AMOUNT_REQUIRED_MESSAGE };

  const match = COLOMBIAN_AMOUNT.exec(cleaned);
  if (!match) return { error: AMOUNT_FORMAT_MESSAGE };

  const whole = match[1].replaceAll('.', '').replace(/^0+(?=\d)/, '');
  const cents = (match[2] ?? '').padEnd(2, '0');
  const hasCents = cents !== '00';

  if (currency === 'COP' && hasCents) return { error: CENTS_IN_PESOS_MESSAGE };
  if (whole === '0' && !hasCents) return { error: NOT_POSITIVE_MESSAGE };
  // El tope es 999.999.999.999 exacto: en dólares, un centavo más también se pasa.
  const tooLarge =
    whole.length > MAX_WHOLE_DIGITS ||
    (whole.length === MAX_WHOLE_DIGITS && /^9+$/.test(whole) && hasCents);
  if (tooLarge) return { error: AMOUNT_TOO_LARGE_MESSAGE };

  return { value: currency === 'COP' ? whole : `${whole}.${cents}` };
}

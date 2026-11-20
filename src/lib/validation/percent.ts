export const PERCENT_FORMAT_MESSAGE =
  'Escribe el porcentaje como 15 o 12,5 (coma para decimales).';

// "15", "12,5", "12.5" o "15 %" → "12.5": la cadena decimal que espera la API. Nunca pasa por
// un número, para no cambiar el valor escrito.
const PERCENT = /^(\d{1,3})(?:[.,](\d{1,2}))?$/;

export type ParsedPercent = { value: string } | { error: string };

export function parsePercent(
  text: string,
  {
    min,
    max,
    minInclusive = true,
  }: { min: number; max: number; minInclusive?: boolean },
): ParsedPercent {
  const cleaned = text.trim().replace(/\s*%$/, '');
  const match = PERCENT.exec(cleaned);
  if (!match) return { error: PERCENT_FORMAT_MESSAGE };
  const whole = match[1].replace(/^0+(?=\d)/, '');
  const value = match[2] ? `${whole}.${match[2]}` : whole;
  const number = Number(value);
  const tooLow = minInclusive ? number < min : number <= min;
  if (tooLow || number > max) {
    return {
      error: minInclusive
        ? `Indica un porcentaje entre ${min} y ${max}.`
        : `Indica un porcentaje mayor que ${min} y hasta ${max}.`,
    };
  }
  return { value };
}

// El porcentaje que llega de la API ("15.00") como se escribe en el campo ("15").
export const percentInput = (value: string | null) =>
  value === null ? '' : value.replace(/\.?0+$/, '').replace('.', ',');

// Reglas de cada tipo de documento, iguales a las de la API. Cada dominio decide qué tipos
// acepta; aquí solo vive cómo se valida cada uno.

export const INVALID_DOCUMENT_MESSAGE = 'No es válido para ese tipo.';
const WRONG_NIT_CHECK_DIGIT_MESSAGE =
  'El dígito de verificación del NIT no coincide.';

export const normalizeDocument = (value: string) =>
  value.replace(/[\s.-]/g, '').toUpperCase();

// [0-9] y no \d: \d acepta dígitos de otros alfabetos, que la API rechaza.
const NUMERIC = /^[0-9]{5,10}$/;
const ALPHANUMERIC = /^[0-9A-Z]{5,20}$/;
// Tarjeta de identidad: el NUIP de 10 dígitos, u 11 en las más antiguas.
const TI = /^[0-9]{10,11}$/;
// Registro civil: el NUIP actual es numérico, pero los registros antiguos traen un serial con
// letras; rechazarlos impediría registrar a esos niños.
const RC = /^[0-9A-Z]{8,15}$/;
// NIT completo: la base y, al final, el dígito de verificación.
const NIT = /^[0-9]{9,10}$/;

// Pesos oficiales de la DIAN, del dígito de la derecha hacia la izquierda.
const NIT_WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

// Dígito de verificación de la base de un NIT (módulo 11 con los pesos de la DIAN).
export function nitCheckDigit(base: string) {
  const total = [...base]
    .reverse()
    .reduce((sum, digit, index) => sum + Number(digit) * NIT_WEIGHTS[index], 0);
  const remainder = total % 11;
  return remainder < 2 ? remainder : 11 - remainder;
}

// Un NIT con la forma correcta pero el dígito equivocado: el error más común al copiarlo,
// que merece su propio mensaje.
const hasWrongNitCheckDigit = (number: string) =>
  NIT.test(number) &&
  nitCheckDigit(number.slice(0, -1)) !== Number(number.at(-1));

const RULES: Record<string, (number: string) => boolean> = {
  CC: (number) => NUMERIC.test(number),
  CE: (number) => ALPHANUMERIC.test(number),
  PPT: (number) => ALPHANUMERIC.test(number),
  PA: (number) => ALPHANUMERIC.test(number),
  TI: (number) => TI.test(number),
  RC: (number) => RC.test(number),
  NIT: (number) => NIT.test(number) && !hasWrongNitCheckDigit(number),
};

// Recibe el número ya normalizado; un tipo sin regla es inválido.
export const isValidDocument = (type: string, number: string) =>
  RULES[type]?.(number) ?? false;

// El mensaje de error del número tal como lo escribió la persona, o undefined si es válido.
export function documentNumberError(type: string, value: string) {
  const number = normalizeDocument(value);
  if (type === 'NIT' && hasWrongNitCheckDigit(number)) {
    return WRONG_NIT_CHECK_DIGIT_MESSAGE;
  }
  return isValidDocument(type, number) ? undefined : INVALID_DOCUMENT_MESSAGE;
}

import { z } from 'zod';

export const INVALID_EMAIL_MESSAGE = 'No es un correo válido.';
const EMAIL_MAX_LENGTH = 254;
// Los correos se aceptan solo en ASCII imprimible, como en la API.
const PRINTABLE_ASCII = /^[ -~]*$/;

// Recibe el correo ya recortado y en minúsculas.
export const isValidEmail = (value: string) =>
  value.length <= EMAIL_MAX_LENGTH &&
  PRINTABLE_ASCII.test(value) &&
  z.email().safeParse(value).success;

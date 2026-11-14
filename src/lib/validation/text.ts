import { z } from 'zod';

// Mismos mensajes que la API.
export const REQUIRED_MESSAGE = 'Este campo es obligatorio.';
const INVALID_CHARACTERS_MESSAGE = 'Contiene caracteres que no se permiten.';
const maxLengthMessage = (max: number) => `Máximo ${max} caracteres.`;

// Caracteres de control (categoría Cc de Unicode) y de formato invisibles (Cf: ancho cero,
// cambio de dirección del texto): un texto escrito por una persona no los lleva, la base no
// puede guardar el NUL y los invisibles hacen que dos nombres iguales a la vista no lo sean.
const FORBIDDEN_CHARACTERS = /[\p{Cc}\p{Cf}]/u;
const withoutForbiddenCharacters = (value: string) =>
  !FORBIDDEN_CHARACTERS.test(value);

// Texto de una línea, recortado y obligatorio.
export const requiredText = (max: number) =>
  z
    .string()
    .trim()
    .min(1, REQUIRED_MESSAGE)
    .max(max, maxLengthMessage(max))
    .refine(withoutForbiddenCharacters, INVALID_CHARACTERS_MESSAGE);

// Texto de una línea, recortado y opcional: vacío se envía como null.
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, maxLengthMessage(max))
    .refine(withoutForbiddenCharacters, INVALID_CHARACTERS_MESSAGE)
    .transform((value) => value || null);

// Como `optionalText`, pero admite saltos de línea (observaciones escritas en varias líneas).
// Los saltos de Windows y los retornos sueltos se guardan como "\n" antes de contar el largo,
// igual que la API; cualquier otro carácter de control se sigue rechazando.
export const optionalMultilineText = (max: number) =>
  z
    .string()
    .transform((value) => value.replace(/\r\n?/g, '\n').trim())
    .pipe(
      z
        .string()
        .max(max, maxLengthMessage(max))
        .refine(
          (value) => withoutForbiddenCharacters(value.replaceAll('\n', '')),
          INVALID_CHARACTERS_MESSAGE,
        ),
    )
    .transform((value) => value || null);

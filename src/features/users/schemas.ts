import { z } from 'zod';

import { DOCUMENT_TYPES } from '@/features/auth/schemas';

// Mismas reglas y mensajes que la API: lo que pasa aquí, la API lo acepta, salvo los datos
// repetidos, que solo ella puede saber.
export const REQUIRED_MESSAGE = 'Este campo es obligatorio.';
export const ROLE_REQUIRED_MESSAGE = 'Selecciona un rol.';
const NAME_MAX_LENGTH = 75;
const EMAIL_MAX_LENGTH = 254;
const DOCUMENT_MAX_LENGTH = 30;
const PHONE_MAX_LENGTH = 20;
const INVALID_DOCUMENT = 'No es válido para ese tipo.';
const INVALID_EMAIL = 'No es un correo válido.';
const INVALID_PHONE = 'Debe ser un celular colombiano de 10 dígitos.';

// [0-9] y no \d: \d acepta dígitos de otros alfabetos, que la API rechaza.
const CC_PATTERN = /^[0-9]{5,10}$/;
const ALPHANUMERIC_PATTERN = /^[0-9A-Z]{5,20}$/;
const PHONE_PATTERN = /^3[0-9]{9}$/;
// Los correos se aceptan solo en ASCII imprimible, como en la API.
const PRINTABLE_ASCII = /^[ -~]*$/;

export const normalizeDocument = (value: string) =>
  value.replace(/[\s.-]/g, '').toUpperCase();

// Un celular son 10 dígitos; con el indicativo de Colombia suman 12, así que un 57 inicial
// solo se quita en ese caso.
export function normalizePhone(value: string) {
  const digits = value.replace(/[\s.()-]/g, '');
  if (digits.startsWith('+57')) return digits.slice(3);
  if (digits.startsWith('57') && digits.length === 12) return digits.slice(2);
  return digits;
}

// Caracteres de control (categoría Cc de Unicode): un nombre escrito por una persona no los
// lleva, y la base no puede guardar el NUL.
const hasControlCharacters = (value: string) =>
  [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 0x1f || (code >= 0x7f && code <= 0x9f);
  });

// Un campo vacío solo muestra "obligatorio": las reglas de formato lo dejan pasar. No se usa
// `abort`, porque además cancelaría la revisión del documento, que se hace sobre el objeto.
const emptyOr = (rule: (value: string) => boolean) => (value: string) =>
  value === '' || rule(value);

const personName = z
  .string()
  .trim()
  .min(1, REQUIRED_MESSAGE)
  .max(NAME_MAX_LENGTH, `Máximo ${NAME_MAX_LENGTH} caracteres.`)
  .refine(
    (value) => !hasControlCharacters(value),
    'Contiene caracteres que no se permiten.',
  );

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, REQUIRED_MESSAGE)
  .refine(
    emptyOr(
      (value) =>
        value.length <= EMAIL_MAX_LENGTH &&
        PRINTABLE_ASCII.test(value) &&
        z.email().safeParse(value).success,
    ),
    INVALID_EMAIL,
  );

const phone = z
  .string()
  .trim()
  .min(1, REQUIRED_MESSAGE)
  .refine(
    emptyOr(
      (value) =>
        value.length <= PHONE_MAX_LENGTH &&
        PHONE_PATTERN.test(normalizePhone(value)),
    ),
    INVALID_PHONE,
  )
  .transform(normalizePhone);

function isValidDocument(type: string, number: string) {
  const pattern = type === 'CC' ? CC_PATTERN : ALPHANUMERIC_PATTERN;
  return number.length <= DOCUMENT_MAX_LENGTH && pattern.test(number);
}

const fields = {
  first_name: personName,
  last_name: personName,
  email,
  document_type: z.enum(DOCUMENT_TYPES),
  document_number: z.string().trim().min(1, REQUIRED_MESSAGE),
  phone,
};

type DocumentPayload = { document_type: string; document_number: string };

// El formato del número depende del tipo, así que se revisa sobre el objeto. `when` hace que
// se revise aunque otro campo tenga error: si no, el aviso del documento aparecería recién
// al corregir los demás.
const checkDocument = <T extends DocumentPayload>(values: T) =>
  isValidDocument(
    values.document_type,
    normalizeDocument(values.document_number),
  );

const documentRule = {
  path: ['document_number'],
  message: INVALID_DOCUMENT,
  when: ({ value }: { value: unknown }) => {
    const candidate = value as Partial<DocumentPayload> | undefined;
    return (
      DOCUMENT_TYPES.includes(
        candidate?.document_type as (typeof DOCUMENT_TYPES)[number],
      ) &&
      typeof candidate?.document_number === 'string' &&
      candidate.document_number.trim() !== ''
    );
  },
};

const withNormalizedDocument = <T extends DocumentPayload>(values: T) => ({
  ...values,
  document_number: normalizeDocument(values.document_number),
});

export const userSchema = z
  .object(fields)
  .refine(checkDocument, documentRule)
  .transform(withNormalizedDocument);

export const createUserSchema = z
  .object({
    ...fields,
    // El selector entrega texto; la API espera el id como número.
    role_id: z.string().min(1, ROLE_REQUIRED_MESSAGE).transform(Number),
  })
  .refine(checkDocument, documentRule)
  .transform(withNormalizedDocument);

export type UserFormValues = z.input<typeof createUserSchema>;
export type UserValues = z.output<typeof userSchema>;
export type CreateUserValues = z.output<typeof createUserSchema>;

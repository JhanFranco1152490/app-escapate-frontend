import type { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { COUNTRY_CODES } from '@/lib/countries';
import { pastDateError } from '@/lib/validation/dates';
import {
  documentNumberError,
  normalizeDocument,
} from '@/lib/validation/document';
import {
  REQUIRED_MESSAGE,
  optionalText,
  requiredText,
} from '@/lib/validation/text';

import type { TravelerCreate, TravelerDocumentType } from './api';

// Mismas reglas y mensajes que la API: lo que pasa aquí, la API lo acepta, salvo el documento
// repetido y los problemas del cliente de referencia, que solo ella puede saber.
export const TRAVELER_DOCUMENT_TYPES = [
  'CC',
  'CE',
  'PPT',
  'PA',
  'TI',
  'RC',
] as const satisfies TravelerDocumentType[];

export const CONSENT_MESSAGE =
  'Confirma que el viajero, o su representante legal si es menor de edad, autorizó el tratamiento de sus datos.';
export const THE_CLIENT_NEEDS_CLIENT_MESSAGE =
  'Elige primero el cliente que también viaja.';
const INVALID_COUNTRY_MESSAGE = 'No es un país válido.';

const personName = requiredText(75);
const notes = optionalText(1000);

// Todo llega como texto del formulario; las reglas van en `travelerIssues` para que se
// informen todos los errores juntos, cada uno en su campo.
const formShape = z.object({
  first_name: z.string(),
  last_name: z.string(),
  document_type: z.string(),
  document_number: z.string(),
  birth_date: z.string(),
  nationality: z.string(),
  // El cliente de referencia: el id es lo que viaja a la API; el nombre y el tipo, lo que se
  // muestra y si se ofrece "es el mismo cliente" (solo una persona).
  reference_client_id: z.number().nullable(),
  reference_client_name: z.string(),
  reference_client_type: z.enum(['person', 'company']).nullable(),
  is_the_client: z.boolean(),
  notes: z.string(),
  data_consent: z.boolean(),
});

export type TravelerFormValues = z.input<typeof formShape>;
export type TravelerPayload = Omit<TravelerCreate, 'data_consent'>;
// El formulario tal como lo reciben las piezas que lo componen.
export type TravelerFormApi = UseFormReturn<
  TravelerFormValues,
  unknown,
  TravelerPayload
>;

type Issue = { path: keyof TravelerFormValues; message: string };

const firstError = (schema: z.ZodType, value: unknown) =>
  schema.safeParse(value).error?.issues[0]?.message;

const isCountryCode = (value: string) =>
  (COUNTRY_CODES as readonly string[]).includes(value);

function travelerIssues(
  values: TravelerFormValues,
  requireConsent: boolean,
): Issue[] {
  const errors: Partial<Record<keyof TravelerFormValues, string>> = {
    first_name: firstError(personName, values.first_name),
    last_name: firstError(personName, values.last_name),
    document_number: values.document_number.trim()
      ? documentNumberError(values.document_type, values.document_number)
      : REQUIRED_MESSAGE,
    birth_date: values.birth_date
      ? pastDateError(values.birth_date)
      : REQUIRED_MESSAGE,
    nationality: !values.nationality
      ? REQUIRED_MESSAGE
      : isCountryCode(values.nationality)
        ? undefined
        : INVALID_COUNTRY_MESSAGE,
    is_the_client:
      values.is_the_client && values.reference_client_id === null
        ? THE_CLIENT_NEEDS_CLIENT_MESSAGE
        : undefined,
    notes: firstError(notes, values.notes),
    data_consent:
      requireConsent && !values.data_consent ? CONSENT_MESSAGE : undefined,
  };
  return Object.entries(errors)
    .filter((entry): entry is [keyof TravelerFormValues, string] => !!entry[1])
    .map(([path, message]) => ({ path, message }));
}

function toTravelerPayload(values: TravelerFormValues): TravelerPayload {
  const hasClient = values.reference_client_id !== null;
  return {
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    document_type: values.document_type as TravelerDocumentType,
    document_number: normalizeDocument(values.document_number),
    birth_date: values.birth_date,
    nationality: values.nationality,
    reference_client_id: values.reference_client_id,
    // Sin cliente de referencia no puede ser "el mismo cliente".
    is_the_client: hasClient && values.is_the_client,
    notes: values.notes.trim() || null,
  };
}

// En el alta se exige la autorización; en la edición no se pide (ya quedó registrada).
export const travelerFormSchema = ({
  requireConsent,
}: {
  requireConsent: boolean;
}) =>
  formShape
    .superRefine((values, ctx) => {
      for (const { path, message } of travelerIssues(values, requireConsent)) {
        ctx.addIssue({ code: 'custom', path: [path], message });
      }
    })
    .transform(toTravelerPayload);

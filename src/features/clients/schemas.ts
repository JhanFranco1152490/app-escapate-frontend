import type { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { toE164, type PhoneCountry } from '@/lib/format/phone';
import { pastDateError } from '@/lib/validation/dates';
import {
  documentNumberError,
  normalizeDocument,
} from '@/lib/validation/document';
import { INVALID_EMAIL_MESSAGE, isValidEmail } from '@/lib/validation/email';
import {
  REQUIRED_MESSAGE,
  optionalText,
  requiredText,
} from '@/lib/validation/text';

import type { ClientCreate, ClientDocumentType, ContactSource } from './api';
import { sourceHasDetail } from './labels';

// Mismas reglas y mensajes que la API: lo que pasa aquí, la API lo acepta, salvo el documento
// repetido, que solo ella puede saber.
export const OTHER_DETAIL_MESSAGE = 'Cuéntanos cuál.';
export const CONSENT_MESSAGE =
  'Confirma que el cliente autorizó el tratamiento de sus datos.';
const INVALID_PHONE_MESSAGE = 'No es un teléfono válido para ese país.';

const personName = requiredText(75);
const businessName = requiredText(150);
const city = optionalText(80);
const contactDetail = optionalText(120);
const notes = optionalText(2000);

// Todo llega como texto del formulario; las reglas van en `clientIssues` para que se informen
// todos los errores juntos, cada uno en su campo, aunque dependan del tipo de cliente.
const formShape = z.object({
  client_type: z.enum(['person', 'company']),
  first_name: z.string(),
  last_name: z.string(),
  business_name: z.string(),
  document_type: z.string(),
  document_number: z.string(),
  birth_date: z.string(),
  phone_country: z.string(),
  phone: z.string(),
  email: z.string(),
  city: z.string(),
  contact_source: z.string(),
  contact_source_detail: z.string(),
  notes: z.string(),
  data_consent: z.boolean(),
});

export type ClientFormValues = z.input<typeof formShape>;
export type ClientPayload = Omit<ClientCreate, 'data_consent'>;
// El formulario tal como lo reciben las piezas que lo componen.
export type ClientFormApi = UseFormReturn<
  ClientFormValues,
  unknown,
  ClientPayload
>;

type Issue = { path: keyof ClientFormValues; message: string };

const firstError = (schema: z.ZodType, value: unknown) =>
  schema.safeParse(value).error?.issues[0]?.message;

function clientIssues(
  values: ClientFormValues,
  requireConsent: boolean,
): Issue[] {
  const person = values.client_type === 'person';
  const errors: Partial<Record<keyof ClientFormValues, string>> = {};
  if (person) {
    errors.first_name = firstError(personName, values.first_name);
    errors.last_name = firstError(personName, values.last_name);
    errors.birth_date = pastDateError(values.birth_date);
  } else {
    errors.business_name = firstError(businessName, values.business_name);
  }
  if (values.document_number.trim()) {
    errors.document_number = documentNumberError(
      person ? values.document_type : 'NIT',
      values.document_number,
    );
  }
  if (!values.phone.trim()) errors.phone = REQUIRED_MESSAGE;
  else if (!toE164(values.phone, values.phone_country as PhoneCountry))
    errors.phone = INVALID_PHONE_MESSAGE;
  const email = values.email.trim().toLowerCase();
  if (email && !isValidEmail(email)) errors.email = INVALID_EMAIL_MESSAGE;
  errors.city = firstError(city, values.city);
  if (!values.contact_source) errors.contact_source = REQUIRED_MESSAGE;
  if (sourceHasDetail(values.contact_source)) {
    errors.contact_source_detail =
      values.contact_source === 'other' && !values.contact_source_detail.trim()
        ? OTHER_DETAIL_MESSAGE
        : firstError(contactDetail, values.contact_source_detail);
  }
  errors.notes = firstError(notes, values.notes);
  if (requireConsent && !values.data_consent)
    errors.data_consent = CONSENT_MESSAGE;
  return Object.entries(errors)
    .filter((entry): entry is [keyof ClientFormValues, string] => !!entry[1])
    .map(([path, message]) => ({ path, message }));
}

// El cuerpo para la API: solo los campos del tipo elegido (la API rechaza los del otro tipo)
// y los vacíos como null. Lo que quedó escrito en un campo oculto al cambiar de tipo no viaja.
function toClientPayload(values: ClientFormValues): ClientPayload {
  const person = values.client_type === 'person';
  const number = values.document_number.trim();
  const source = values.contact_source as ContactSource;
  return {
    client_type: values.client_type,
    first_name: person ? values.first_name.trim() : null,
    last_name: person ? values.last_name.trim() : null,
    business_name: person ? null : values.business_name.trim(),
    document_type: number
      ? person
        ? (values.document_type as ClientDocumentType)
        : 'NIT'
      : null,
    document_number: number ? normalizeDocument(number) : null,
    birth_date: person && values.birth_date ? values.birth_date : null,
    phone: toE164(values.phone, values.phone_country as PhoneCountry)!,
    email: values.email.trim().toLowerCase() || null,
    city: values.city.trim() || null,
    contact_source: source,
    contact_source_detail: sourceHasDetail(source)
      ? values.contact_source_detail.trim() || null
      : null,
    notes: values.notes.trim() || null,
  };
}

// En el alta se exige la autorización; en la edición no se pide (ya quedó registrada).
export const clientFormSchema = ({
  requireConsent,
}: {
  requireConsent: boolean;
}) =>
  formShape
    .superRefine((values, ctx) => {
      for (const { path, message } of clientIssues(values, requireConsent)) {
        ctx.addIssue({ code: 'custom', path: [path], message });
      }
    })
    .transform(toClientPayload);

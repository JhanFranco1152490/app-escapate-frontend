import type { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { toE164, type PhoneCountry } from '@/lib/format/phone';
import {
  documentNumberError,
  normalizeDocument,
} from '@/lib/validation/document';
import { INVALID_EMAIL_MESSAGE, isValidEmail } from '@/lib/validation/email';
import { optionalText, requiredText } from '@/lib/validation/text';

import type {
  SupplierCategory,
  SupplierCreate,
  SupplierDocumentType,
} from './api';
import { SUPPLIER_CATEGORIES } from './categories';

// Mismas reglas y mensajes que la API: lo que pasa aquí, la API lo acepta, salvo el documento
// repetido, que solo ella puede saber.
export const CONTACT_REQUIRED_MESSAGE =
  'Indica un teléfono o un correo de contacto.';
export const CATEGORIES_REQUIRED_MESSAGE = 'Elige al menos una clasificación.';
export const DOCUMENT_TYPE_REQUIRED_MESSAGE =
  'Elige también el tipo de documento.';
export const DOCUMENT_NUMBER_REQUIRED_MESSAGE = 'Indica también el número.';
export const INVALID_COMMISSION_MESSAGE =
  'Indica un porcentaje de 0 a 100, con hasta dos decimales.';
const INVALID_PHONE_MESSAGE = 'No es un teléfono válido para ese país.';

// Los mensajes que significan "falta un dato", para contarlos en el aviso de arriba.
export const MISSING_MESSAGES = [
  CONTACT_REQUIRED_MESSAGE,
  CATEGORIES_REQUIRED_MESSAGE,
  DOCUMENT_TYPE_REQUIRED_MESSAGE,
  DOCUMENT_NUMBER_REQUIRED_MESSAGE,
];

const tradeName = requiredText(150);
const contactName = requiredText(150);
const legalName = optionalText(150);
const coverageZone = optionalText(150);
const city = optionalText(80);
const contactRole = optionalText(80);
const paymentTerms = optionalText(500);
const notes = optionalText(2000);

// Hasta 100, con uno o dos decimales (coma o punto).
const COMMISSION = /^[0-9]{1,3}([.,][0-9]{1,2})?$/;

// Todo llega como texto del formulario; las reglas van en `supplierIssues` para que se
// informen todos los errores juntos, cada uno en su campo.
const formShape = z.object({
  trade_name: z.string(),
  legal_name: z.string(),
  document_type: z.string(),
  document_number: z.string(),
  categories: z.array(z.string()),
  city: z.string(),
  coverage_zone: z.string(),
  contact_name: z.string(),
  contact_role: z.string(),
  contact_phone_country: z.string(),
  contact_phone: z.string(),
  contact_email: z.string(),
  payment_terms: z.string(),
  commission_rate: z.string(),
  agreement_valid_until: z.string(),
  notes: z.string(),
});

export type SupplierFormValues = z.input<typeof formShape>;
export type SupplierPayload = SupplierCreate;
// El formulario tal como lo reciben las piezas que lo componen.
export type SupplierFormApi = UseFormReturn<
  SupplierFormValues,
  unknown,
  SupplierPayload
>;

type Issue = { path: keyof SupplierFormValues; message: string };

const firstError = (schema: z.ZodType, value: unknown) =>
  schema.safeParse(value).error?.issues[0]?.message;

const commissionError = (value: string) => {
  const rate = value.trim();
  if (!rate) return undefined;
  const valid = COMMISSION.test(rate) && Number(rate.replace(',', '.')) <= 100;
  return valid ? undefined : INVALID_COMMISSION_MESSAGE;
};

function documentError(type: string, value: string) {
  const number = value.trim();
  if (number) {
    return type
      ? documentNumberError(type, number)
      : DOCUMENT_TYPE_REQUIRED_MESSAGE;
  }
  return type ? DOCUMENT_NUMBER_REQUIRED_MESSAGE : undefined;
}

function contactIssues(values: SupplierFormValues) {
  const errors: Partial<Record<keyof SupplierFormValues, string>> = {};
  const phone = values.contact_phone.trim();
  const email = values.contact_email.trim().toLowerCase();
  if (!phone && !email) {
    errors.contact_phone = CONTACT_REQUIRED_MESSAGE;
    errors.contact_email = CONTACT_REQUIRED_MESSAGE;
    return errors;
  }
  // Si uno está mal escrito y el otro vacío, solo se marca el mal escrito: ya hay un dato de
  // contacto, falta corregirlo.
  if (phone && !toE164(phone, values.contact_phone_country as PhoneCountry)) {
    errors.contact_phone = INVALID_PHONE_MESSAGE;
  }
  if (email && !isValidEmail(email))
    errors.contact_email = INVALID_EMAIL_MESSAGE;
  return errors;
}

function supplierIssues(values: SupplierFormValues): Issue[] {
  const errors: Partial<Record<keyof SupplierFormValues, string>> = {
    trade_name: firstError(tradeName, values.trade_name),
    legal_name: firstError(legalName, values.legal_name),
    document_number: documentError(
      values.document_type,
      values.document_number,
    ),
    categories: values.categories.length
      ? undefined
      : CATEGORIES_REQUIRED_MESSAGE,
    city: firstError(city, values.city),
    coverage_zone: firstError(coverageZone, values.coverage_zone),
    contact_name: firstError(contactName, values.contact_name),
    contact_role: firstError(contactRole, values.contact_role),
    payment_terms: firstError(paymentTerms, values.payment_terms),
    commission_rate: commissionError(values.commission_rate),
    notes: firstError(notes, values.notes),
    ...contactIssues(values),
  };
  return Object.entries(errors)
    .filter((entry): entry is [keyof SupplierFormValues, string] => !!entry[1])
    .map(([path, message]) => ({ path, message }));
}

// El cuerpo para la API: los vacíos como null, el documento normalizado y las categorías en el
// orden fijo de la lista.
function toSupplierPayload(values: SupplierFormValues): SupplierPayload {
  const number = values.document_number.trim();
  const phone = values.contact_phone.trim();
  const rate = values.commission_rate.trim();
  const trimmed = (value: string) => value.trim() || null;
  return {
    trade_name: values.trade_name.trim(),
    legal_name: trimmed(values.legal_name),
    document_type: number
      ? (values.document_type as SupplierDocumentType)
      : null,
    document_number: number ? normalizeDocument(number) : null,
    categories: SUPPLIER_CATEGORIES.filter((category: SupplierCategory) =>
      values.categories.includes(category),
    ),
    city: trimmed(values.city),
    coverage_zone: trimmed(values.coverage_zone),
    contact_name: values.contact_name.trim(),
    contact_role: trimmed(values.contact_role),
    contact_phone: phone
      ? toE164(phone, values.contact_phone_country as PhoneCountry)
      : null,
    contact_email: values.contact_email.trim().toLowerCase() || null,
    payment_terms: trimmed(values.payment_terms),
    commission_rate: rate ? rate.replace(',', '.') : null,
    agreement_valid_until: values.agreement_valid_until || null,
    notes: trimmed(values.notes),
  };
}

export const supplierFormSchema = formShape
  .superRefine((values, ctx) => {
    for (const { path, message } of supplierIssues(values)) {
      ctx.addIssue({ code: 'custom', path: [path], message });
    }
  })
  .transform(toSupplierPayload);

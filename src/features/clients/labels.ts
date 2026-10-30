import type { ClientDocumentType, ClientType, ContactSource } from './api';

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  person: 'Persona',
  company: 'Empresa',
};

export const PERSON_DOCUMENT_TYPES = [
  'CC',
  'CE',
  'PPT',
  'PA',
] as const satisfies ClientDocumentType[];

export const CONTACT_SOURCE_LABELS: Record<ContactSource, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  google: 'Google',
  referral: 'Referido',
  walk_in: 'Visita a la oficina',
  other: 'Otro',
};

export const CONTACT_SOURCES = Object.keys(
  CONTACT_SOURCE_LABELS,
) as ContactSource[];

// Solo estos medios llevan detalle: con "Otro" es obligatorio y con "Referido", opcional.
export const sourceHasDetail = (source: string) =>
  source === 'other' || source === 'referral';

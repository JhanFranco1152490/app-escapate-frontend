import { DEFAULT_PHONE_COUNTRY, splitPhone } from '@/lib/format/phone';

import type { ClientDetail } from './api';
import type { ClientFormValues } from './schemas';

export const EMPTY_CLIENT_FORM: ClientFormValues = {
  client_type: 'person',
  first_name: '',
  last_name: '',
  business_name: '',
  document_type: 'CC',
  document_number: '',
  birth_date: '',
  phone_country: DEFAULT_PHONE_COUNTRY,
  phone: '',
  email: '',
  city: '',
  contact_source: '',
  contact_source_detail: '',
  notes: '',
  data_consent: false,
};

// La ficha como valores del formulario de edición.
export function clientFormValues(client: ClientDetail): ClientFormValues {
  const phone = splitPhone(client.phone);
  return {
    client_type: client.client_type,
    first_name: client.first_name ?? '',
    last_name: client.last_name ?? '',
    business_name: client.business_name ?? '',
    document_type:
      client.document_type ?? (client.client_type === 'company' ? 'NIT' : 'CC'),
    document_number: client.document_number ?? '',
    birth_date: client.birth_date ?? '',
    phone_country: phone.country,
    phone: phone.number,
    email: client.email ?? '',
    city: client.city ?? '',
    contact_source: client.contact_source,
    contact_source_detail: client.contact_source_detail ?? '',
    notes: client.notes ?? '',
    data_consent: false,
  };
}

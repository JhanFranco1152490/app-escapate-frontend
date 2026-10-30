import type { ClientDetail } from '@/features/clients/api';
import { DEFAULT_COUNTRY } from '@/lib/countries';

import type { TravelerDetail } from './api';
import { TRAVELER_DOCUMENT_TYPES, type TravelerFormValues } from './schemas';

export const EMPTY_TRAVELER_FORM: TravelerFormValues = {
  first_name: '',
  last_name: '',
  document_type: 'CC',
  document_number: '',
  birth_date: '',
  nationality: DEFAULT_COUNTRY,
  reference_client_id: null,
  reference_client_name: '',
  reference_client_type: null,
  is_the_client: false,
  notes: '',
  data_consent: false,
};

// "Nuevo viajero" desde la ficha de un cliente: solo el cliente de referencia ya elegido.
export const withReferenceClient = (
  client: Pick<ClientDetail, 'id' | 'display_name' | 'client_type'>,
): TravelerFormValues => ({
  ...EMPTY_TRAVELER_FORM,
  reference_client_id: client.id,
  reference_client_name: client.display_name,
  reference_client_type: client.client_type,
});

const isTravelerDocument = (type: string | null) =>
  (TRAVELER_DOCUMENT_TYPES as readonly (string | null)[]).includes(type);

// "Registrar como viajero": copia de la ficha del cliente lo que el viajero también necesita.
// Es una copia, no un enlace: después cada ficha se edita por su lado. El documento y la
// fecha son opcionales en el cliente y obligatorios en el viajero; si faltan, quedan vacíos
// para que el asesor los complete.
export function fromClient(client: ClientDetail): TravelerFormValues {
  const copiesDocument = isTravelerDocument(client.document_type);
  return {
    ...withReferenceClient(client),
    first_name: client.first_name ?? '',
    last_name: client.last_name ?? '',
    document_type: copiesDocument ? client.document_type! : 'CC',
    document_number: copiesDocument ? (client.document_number ?? '') : '',
    birth_date: client.birth_date ?? '',
    is_the_client: true,
  };
}

// La ficha como valores del formulario de edición. El tipo del cliente de referencia no viene
// en la ficha del viajero: si ya es "el mismo cliente", es una persona; si no, se deja sin
// saber y quien edita puede pedirlo.
export function travelerFormValues(
  traveler: TravelerDetail,
): TravelerFormValues {
  return {
    first_name: traveler.first_name,
    last_name: traveler.last_name,
    document_type: traveler.document_type,
    document_number: traveler.document_number,
    birth_date: traveler.birth_date,
    nationality: traveler.nationality,
    reference_client_id: traveler.reference_client?.id ?? null,
    reference_client_name: traveler.reference_client?.display_name ?? '',
    reference_client_type: traveler.is_the_client ? 'person' : null,
    is_the_client: traveler.is_the_client,
    notes: traveler.notes ?? '',
    data_consent: false,
  };
}

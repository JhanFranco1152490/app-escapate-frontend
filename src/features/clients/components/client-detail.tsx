import { DetailItem } from '@/components/detail-item';
import { formatDateTime, formatLongDate } from '@/lib/format/dates';
import { formatDocument } from '@/lib/format/document';
import { formatPhone } from '@/lib/format/phone';

import type { ClientDetail as ClientDetailData } from '../api';
import { CLIENT_TYPE_LABELS, CONTACT_SOURCE_LABELS } from '../labels';

const NOT_REGISTERED = 'Sin registrar';

const sectionClass = 'rounded-md border bg-card';
const titleClass = 'border-b px-5 py-4 font-heading text-lg font-semibold';

export function ClientDetail({ client }: { client: ClientDetailData }) {
  const person = client.client_type === 'person';
  const source = CONTACT_SOURCE_LABELS[client.contact_source];

  return (
    <>
      <section aria-labelledby="client-data-title" className={sectionClass}>
        <h2 id="client-data-title" className={titleClass}>
          Datos del cliente
        </h2>
        <dl className="grid gap-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem term="Tipo">
            {CLIENT_TYPE_LABELS[client.client_type]}
          </DetailItem>
          <DetailItem term="Documento">
            {formatDocument(client.document_type, client.document_number) ??
              'Sin documento'}
          </DetailItem>
          {person && (
            <DetailItem term="Fecha de nacimiento">
              {client.birth_date
                ? formatLongDate(client.birth_date)
                : NOT_REGISTERED}
            </DetailItem>
          )}
          <DetailItem term="Teléfono">{formatPhone(client.phone)}</DetailItem>
          <DetailItem term="Correo">
            {client.email ?? NOT_REGISTERED}
          </DetailItem>
          <DetailItem term="Ciudad">{client.city ?? NOT_REGISTERED}</DetailItem>
          <DetailItem term="Medio de contacto">
            {client.contact_source_detail
              ? `${source}: ${client.contact_source_detail}`
              : source}
          </DetailItem>
          <DetailItem term="Notas" className="sm:col-span-2 lg:col-span-3">
            {client.notes ?? 'Sin notas'}
          </DetailItem>
        </dl>
      </section>
      <section aria-labelledby="client-record-title" className={sectionClass}>
        <h2 id="client-record-title" className={titleClass}>
          Registro
        </h2>
        <dl className="grid gap-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem term="Registrado">
            Por {client.created_by.full_name} el{' '}
            {formatDateTime(client.created_at)}
          </DetailItem>
          <DetailItem term="Autorización de datos">
            Registrada por {client.data_consent_by.full_name} el{' '}
            {formatDateTime(client.data_consent_at)}
          </DetailItem>
          <DetailItem term="Última modificación">
            {formatDateTime(client.updated_at)}
          </DetailItem>
        </dl>
      </section>
    </>
  );
}

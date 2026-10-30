import Link from 'next/link';

import { DetailItem } from '@/components/detail-item';
import { Tag } from '@/components/tag';
import { useHasPermission } from '@/features/auth/permissions';
import { countryName } from '@/lib/countries';
import { formatDateTime, formatLongDate } from '@/lib/format/dates';
import { formatDocument } from '@/lib/format/document';

import type { TravelerDetail as TravelerDetailData } from '../api';

const sectionClass = 'rounded-md border bg-card';
const titleClass = 'border-b px-5 py-4 font-heading text-lg font-semibold';

function ReferenceClient({ traveler }: { traveler: TravelerDetailData }) {
  const canViewClients = useHasPermission('clients.view');
  const client = traveler.reference_client;
  if (!client) return <>Sin cliente de referencia</>;
  // Sin `clients.view` la ficha del cliente respondería "Sin permiso": se muestra el nombre.
  return canViewClients ? (
    <Link
      href={`/clientes/${client.id}`}
      className="underline underline-offset-4"
    >
      {client.display_name}
    </Link>
  ) : (
    <>{client.display_name}</>
  );
}

export function TravelerDetail({ traveler }: { traveler: TravelerDetailData }) {
  const age = traveler.age === 1 ? '1 año' : `${traveler.age} años`;

  return (
    <>
      <section aria-labelledby="traveler-data-title" className={sectionClass}>
        <h2 id="traveler-data-title" className={titleClass}>
          Datos del viajero
        </h2>
        <dl className="grid gap-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem term="Documento">
            {formatDocument(traveler.document_type, traveler.document_number)}
          </DetailItem>
          <DetailItem term="Fecha de nacimiento">
            <span className="inline-flex flex-wrap items-center gap-2">
              {formatLongDate(traveler.birth_date)} · {age}
              {traveler.is_minor && <Tag>Menor de edad</Tag>}
            </span>
          </DetailItem>
          <DetailItem term="Nacionalidad">
            {countryName(traveler.nationality)}
          </DetailItem>
          <DetailItem term="Cliente de referencia">
            <span className="inline-flex flex-wrap items-center gap-2">
              <ReferenceClient traveler={traveler} />
              {traveler.is_the_client && <Tag tone="accent">Es el cliente</Tag>}
            </span>
          </DetailItem>
          <DetailItem
            term="Observaciones"
            className="sm:col-span-2 lg:col-span-3"
          >
            {traveler.notes ?? 'Sin observaciones'}
          </DetailItem>
        </dl>
      </section>
      <section aria-labelledby="traveler-record-title" className={sectionClass}>
        <h2 id="traveler-record-title" className={titleClass}>
          Registro
        </h2>
        <dl className="grid gap-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem term="Registrado">
            Por {traveler.created_by.full_name} el{' '}
            {formatDateTime(traveler.created_at)}
          </DetailItem>
          <DetailItem term="Autorización de datos">
            Registrada por {traveler.data_consent_by.full_name} el{' '}
            {formatDateTime(traveler.data_consent_at)}
          </DetailItem>
          <DetailItem term="Última modificación">
            {formatDateTime(traveler.updated_at)}
          </DetailItem>
        </dl>
      </section>
    </>
  );
}

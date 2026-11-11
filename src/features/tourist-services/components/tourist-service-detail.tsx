import { DetailItem } from '@/components/detail-item';
import { SUPPLIER_CATEGORY_LABELS } from '@/features/suppliers/categories';
import { formatDateTime } from '@/lib/format/dates';

import type { TouristServiceDetail as ServiceDetailData } from '../api';
import { attributeDetails } from '../attribute-details';
import { typedService } from '../attributes';

const sectionClass = 'rounded-md border bg-card';
const titleClass = 'border-b px-5 py-4 font-heading text-lg font-semibold';
const gridClass = 'grid gap-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3';
const wide = 'sm:col-span-2 lg:col-span-3';

// Características y condiciones del servicio (los datos comunes y los de su tipo) y quién lo
// registró. Los opcionales vacíos no se muestran.
export function TouristServiceDetail({
  service,
}: {
  service: ServiceDetailData;
}) {
  return (
    <>
      <section aria-labelledby="service-data-title" className={sectionClass}>
        <h2 id="service-data-title" className={titleClass}>
          Características y condiciones
        </h2>
        <dl className={gridClass}>
          <DetailItem term="Tipo de servicio">
            {SUPPLIER_CATEGORY_LABELS[service.service_type]}
          </DetailItem>
          <DetailItem term="Destino">{service.destination}</DetailItem>
          {attributeDetails(typedService(service)).map(({ term, value }) => (
            <DetailItem key={term} term={term}>
              {value}
            </DetailItem>
          ))}
          {service.description && (
            <DetailItem term="Descripción" className={wide}>
              {service.description}
            </DetailItem>
          )}
          {service.conditions && (
            <DetailItem
              term="Condiciones y política de cancelación"
              className={wide}
            >
              {service.conditions}
            </DetailItem>
          )}
        </dl>
      </section>
      <section aria-labelledby="service-record-title" className={sectionClass}>
        <h2 id="service-record-title" className={titleClass}>
          Registro
        </h2>
        <dl className={gridClass}>
          <DetailItem term="Registrado">
            Por {service.created_by.full_name} el{' '}
            {formatDateTime(service.created_at)}
          </DetailItem>
          <DetailItem term="Última modificación">
            {formatDateTime(service.updated_at)}
          </DetailItem>
        </dl>
      </section>
    </>
  );
}

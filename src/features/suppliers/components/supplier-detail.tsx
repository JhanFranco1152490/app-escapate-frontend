import { DetailItem } from '@/components/detail-item';
import { Tag } from '@/components/tag';
import { formatDateTime, formatLongDate } from '@/lib/format/dates';
import { formatDocument } from '@/lib/format/document';
import { formatPhone } from '@/lib/format/phone';

import type { SupplierDetail as SupplierDetailData } from '../api';
import { SUPPLIER_CATEGORY_LABELS } from '../categories';

const NOT_REGISTERED = 'Sin registrar';

const sectionClass = 'rounded-md border bg-card';
const titleClass = 'border-b px-5 py-4 font-heading text-lg font-semibold';
const gridClass = 'grid gap-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3';
const linkClass = 'underline underline-offset-4 hover:text-foreground';

// El número de teléfono se marca con el E.164 y se ve como se dicta.
function PhoneLink({ e164 }: { e164: string }) {
  return (
    <a href={`tel:${e164}`} className={linkClass}>
      {formatPhone(e164)}
    </a>
  );
}

export function SupplierDetail({ supplier }: { supplier: SupplierDetailData }) {
  return (
    <>
      <section aria-labelledby="supplier-data-title" className={sectionClass}>
        <h2 id="supplier-data-title" className={titleClass}>
          Identificación y clasificación
        </h2>
        <dl className={gridClass}>
          <DetailItem term="Nombre comercial">{supplier.trade_name}</DetailItem>
          <DetailItem term="Razón social">
            {supplier.legal_name ?? NOT_REGISTERED}
          </DetailItem>
          <DetailItem term="Documento">
            {formatDocument(supplier.document_type, supplier.document_number) ??
              'Sin documento'}
          </DetailItem>
          <DetailItem term="Clasificación">
            <span className="flex flex-wrap gap-1">
              {supplier.categories.map((category) => (
                <Tag key={category}>{SUPPLIER_CATEGORY_LABELS[category]}</Tag>
              ))}
            </span>
          </DetailItem>
          <DetailItem term="Ciudad">
            {supplier.city ?? NOT_REGISTERED}
          </DetailItem>
          <DetailItem term="Zona de cobertura">
            {supplier.coverage_zone ?? NOT_REGISTERED}
          </DetailItem>
        </dl>
      </section>
      <section
        aria-labelledby="supplier-contact-title"
        className={sectionClass}
      >
        <h2 id="supplier-contact-title" className={titleClass}>
          Contacto
        </h2>
        <dl className={gridClass}>
          <DetailItem term="Persona de contacto">
            {supplier.contact_name}
          </DetailItem>
          <DetailItem term="Cargo o área">
            {supplier.contact_role ?? NOT_REGISTERED}
          </DetailItem>
          <DetailItem term="Teléfono">
            {supplier.contact_phone ? (
              <PhoneLink e164={supplier.contact_phone} />
            ) : (
              NOT_REGISTERED
            )}
          </DetailItem>
          <DetailItem term="Correo">
            {supplier.contact_email ? (
              <a
                href={`mailto:${supplier.contact_email}`}
                className={linkClass}
              >
                {supplier.contact_email}
              </a>
            ) : (
              NOT_REGISTERED
            )}
          </DetailItem>
        </dl>
      </section>
      <section
        aria-labelledby="supplier-commercial-title"
        className={sectionClass}
      >
        <h2 id="supplier-commercial-title" className={titleClass}>
          Información comercial
        </h2>
        <dl className={gridClass}>
          <DetailItem term="Condiciones de pago" className="sm:col-span-2">
            {supplier.payment_terms ?? NOT_REGISTERED}
          </DetailItem>
          <DetailItem term="Comisión acordada">
            {supplier.commission_rate
              ? `${Number(supplier.commission_rate)} %`
              : NOT_REGISTERED}
          </DetailItem>
          <DetailItem term="Vigencia del convenio">
            {supplier.agreement_valid_until ? (
              <span className="flex flex-wrap items-center gap-2">
                {formatLongDate(supplier.agreement_valid_until)}
                {supplier.agreement_expired && (
                  <Tag tone="accent">Convenio vencido</Tag>
                )}
              </span>
            ) : (
              NOT_REGISTERED
            )}
          </DetailItem>
          <DetailItem term="Notas" className="sm:col-span-2 lg:col-span-3">
            {supplier.notes ?? 'Sin notas'}
          </DetailItem>
        </dl>
      </section>
      <section aria-labelledby="supplier-record-title" className={sectionClass}>
        <h2 id="supplier-record-title" className={titleClass}>
          Registro
        </h2>
        <dl className={gridClass}>
          <DetailItem term="Registrado">
            Por {supplier.created_by.full_name} el{' '}
            {formatDateTime(supplier.created_at)}
          </DetailItem>
          <DetailItem term="Última modificación">
            {formatDateTime(supplier.updated_at)}
          </DetailItem>
        </dl>
      </section>
    </>
  );
}

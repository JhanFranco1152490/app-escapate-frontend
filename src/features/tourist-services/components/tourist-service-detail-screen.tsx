'use client';

import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Alert } from '@/components/alert';
import { ButtonLink } from '@/components/button-link';
import { PageHeader } from '@/components/page-header';
import { useHasPermission } from '@/features/auth/permissions';
import { SUPPLIER_CATEGORY_LABELS } from '@/features/suppliers/categories';
import { SupplierStatusBadge } from '@/features/suppliers/components/supplier-status-badge';
import type { ActionFeedback } from '@/lib/action-feedback';
import { formatDay } from '@/lib/format/dates';
import { parseRouteId } from '@/lib/route-id';
import { usePageNotice } from '@/lib/use-page-notice';

import type { TouristServiceDetail as ServiceDetailData } from '../api';
import { serviceNoticeTarget } from '../service-notice';
import { ServiceLoader } from './service-loader';
import { ServiceRatesSection } from './service-rates-section';
import { TouristServiceDetail } from './tourist-service-detail';
import { TouristServiceStatusActions } from './tourist-service-status-actions';

const trailLink = 'underline-offset-4 hover:text-foreground hover:underline';

// "Proveedores / Hotel Costa Azul / Habitación familiar": el servicio se encuentra desde su
// proveedor, así que la vuelta lleva a él.
function ServiceTrail({ service }: { service: ServiceDetailData }) {
  return (
    <nav aria-label="Ruta" className="text-sm text-muted-foreground">
      <ol className="flex min-h-11 flex-wrap items-center gap-x-2">
        <li>
          <Link href="/proveedores" className={trailLink}>
            Proveedores
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link
            href={`/proveedores/${service.supplier.id}`}
            className={trailLink}
          >
            {service.supplier.trade_name}
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="text-foreground">
          {service.name}
        </li>
      </ol>
    </nav>
  );
}

export function TouristServiceDetailScreen({ id }: { id: string }) {
  const serviceId = parseRouteId(id);
  const canManage = useHasPermission('tourist_services.manage');
  // "Servicio registrado." o "Cambios guardados.", si se llega desde el formulario.
  const pageNotice = usePageNotice(serviceNoticeTarget(serviceId ?? 0));
  const [feedback, setFeedback] = useState<ActionFeedback>();

  return (
    <ServiceLoader serviceId={serviceId}>
      {(service) => (
        <>
          <ServiceTrail service={service} />
          <PageHeader
            eyebrow={`${service.supplier.trade_name} · ${SUPPLIER_CATEGORY_LABELS[service.service_type]}`}
            title={service.name}
            actions={
              canManage && (
                <>
                  <ButtonLink
                    href={`/servicios/${service.id}/editar`}
                    variant="outline"
                  >
                    <Pencil aria-hidden="true" />
                    Editar datos
                  </ButtonLink>
                  <TouristServiceStatusActions
                    service={service}
                    onDone={setFeedback}
                  />
                </>
              )
            }
          />
          <div>
            <SupplierStatusBadge active={service.is_active} />
          </div>
          {!service.is_active && service.deactivated_at && (
            <Alert
              variant="info"
              title={`Servicio inactivo desde el ${formatDay(service.deactivated_at)}`}
            />
          )}
          {!service.supplier.is_active && (
            <Alert
              variant="info"
              title={`El proveedor ${service.supplier.trade_name} está inactivo.`}
            />
          )}
          {feedback ? (
            <Alert variant={feedback.variant} title={feedback.text} />
          ) : (
            pageNotice && <Alert variant="info" title={pageNotice} />
          )}
          <TouristServiceDetail service={service} />
          <ServiceRatesSection service={service} />
        </>
      )}
    </ServiceLoader>
  );
}

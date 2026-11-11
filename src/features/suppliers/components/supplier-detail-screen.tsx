'use client';

import { Pencil } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { Alert } from '@/components/alert';
import { ButtonLink } from '@/components/button-link';
import { PageHeader } from '@/components/page-header';
import { useHasPermission } from '@/features/auth/permissions';
import type { ActionFeedback } from '@/lib/action-feedback';
import { formatDay } from '@/lib/format/dates';
import { parseRouteId } from '@/lib/route-id';
import { usePageNotice } from '@/lib/use-page-notice';

import type { SupplierDetail as SupplierDetailData } from '../api';
import { supplierNoticeTarget } from '../supplier-notice';
import { SupplierDetail } from './supplier-detail';
import { SupplierLoader } from './supplier-loader';
import { SupplierStatusActions } from './supplier-status-actions';
import { SupplierStatusBadge } from './supplier-status-badge';

type SupplierDetailScreenProps = {
  id: string;
  // Lo que otro dominio muestra debajo de la ficha (sus servicios), con el proveedor ya
  // cargado: este dominio no sabe qué es ni lo importa.
  services?: (supplier: SupplierDetailData) => ReactNode;
};

export function SupplierDetailScreen({
  id,
  services,
}: SupplierDetailScreenProps) {
  const supplierId = parseRouteId(id);
  const canManage = useHasPermission('suppliers.manage');
  // "Proveedor registrado." o "Cambios guardados.", si se llega desde el formulario.
  const pageNotice = usePageNotice(supplierNoticeTarget(supplierId ?? 0));
  const [feedback, setFeedback] = useState<ActionFeedback>();

  return (
    <SupplierLoader
      supplierId={supplierId}
      back={{ href: '/proveedores', label: 'Proveedores' }}
    >
      {(supplier) => (
        <>
          <PageHeader
            eyebrow="Oferta turística / 02"
            title={supplier.trade_name}
            actions={
              canManage && (
                <>
                  <ButtonLink
                    href={`/proveedores/${supplier.id}/editar`}
                    variant="outline"
                  >
                    <Pencil aria-hidden="true" />
                    Editar datos
                  </ButtonLink>
                  <SupplierStatusActions
                    supplier={supplier}
                    onDone={setFeedback}
                  />
                </>
              )
            }
          />
          <div>
            <SupplierStatusBadge active={supplier.is_active} />
          </div>
          {!supplier.is_active && supplier.deactivated_at && (
            <Alert
              variant="info"
              title={`Proveedor inactivo desde el ${formatDay(supplier.deactivated_at)}`}
            />
          )}
          {feedback ? (
            <Alert variant={feedback.variant} title={feedback.text} />
          ) : (
            pageNotice && <Alert variant="info" title={pageNotice} />
          )}
          <SupplierDetail supplier={supplier} />
          {services?.(supplier)}
        </>
      )}
    </SupplierLoader>
  );
}

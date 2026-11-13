'use client';

import { StatusActions } from '@/components/status-actions';
import type { ActionFeedback } from '@/lib/action-feedback';

import { useChangeSupplierStatus, type SupplierDetail } from '../api';

type SupplierStatusActionsProps = {
  supplier: Pick<SupplierDetail, 'id' | 'trade_name' | 'is_active' | 'version'>;
  onDone: (feedback: ActionFeedback) => void;
};

export function SupplierStatusActions({
  supplier,
  onDone,
}: SupplierStatusActionsProps) {
  return (
    <StatusActions
      active={supplier.is_active}
      version={supplier.version}
      change={useChangeSupplierStatus(supplier.id)}
      confirmTitle={`¿Desactivar a ${supplier.trade_name}?`}
      confirmDescription={`${supplier.trade_name} dejará de aparecer al registrar servicios y en la oferta turística. Su información y su historial se conservan.`}
      doneMessages={{
        deactivate: 'Proveedor desactivado.',
        activate: 'Proveedor activado.',
      }}
      onDone={onDone}
    />
  );
}

'use client';

import { StatusActions } from '@/components/status-actions';
import type { ActionFeedback } from '@/lib/action-feedback';

import {
  useChangeTouristServiceStatus,
  type TouristServiceDetail,
} from '../api';

type TouristServiceStatusActionsProps = {
  service: Pick<TouristServiceDetail, 'id' | 'name' | 'is_active' | 'version'>;
  onDone: (feedback: ActionFeedback) => void;
};

// Activar con el proveedor inactivo lo rechaza la API (409) y el motivo sale en la ficha.
export function TouristServiceStatusActions({
  service,
  onDone,
}: TouristServiceStatusActionsProps) {
  return (
    <StatusActions
      active={service.is_active}
      version={service.version}
      change={useChangeTouristServiceStatus(service.id)}
      confirmTitle={`¿Desactivar ${service.name}?`}
      confirmDescription={`${service.name} dejará de aparecer en la oferta turística. Sus tarifas e historial se conservan.`}
      doneMessages={{
        deactivate: 'Servicio desactivado.',
        activate: 'Servicio activado.',
      }}
      onDone={onDone}
    />
  );
}

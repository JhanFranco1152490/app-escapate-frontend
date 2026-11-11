'use client';

import { useState } from 'react';

import { Alert } from '@/components/alert';
import { isApiError } from '@/lib/api/errors';

import type { ServiceType } from '../api';
import { useCreateRate } from '../rate-api';
import { emptyRateForm } from '../rate-form-values';
import type { RatePayload } from '../rate-schemas';
import { ServiceRateForm } from './service-rate-form';

type CreateRatePanelProps = {
  serviceId: number;
  serviceType: ServiceType;
  onSaved: () => void;
  onCancel: () => void;
};

export function CreateRatePanel({
  serviceId,
  serviceType,
  onSaved,
  onCancel,
}: CreateRatePanelProps) {
  const createRate = useCreateRate(serviceId);
  // Si desactivan el servicio mientras se escribe, la API lo rechaza: se dice arriba y lo
  // escrito se queda.
  const [conflict, setConflict] = useState<string>();

  const submit = async (payload: RatePayload) => {
    setConflict(undefined);
    try {
      await createRate.mutateAsync(payload);
      onSaved();
    } catch (error) {
      if (!isApiError(error) || error.code !== 'service_inactive') throw error;
      setConflict(error.message);
    }
  };

  return (
    <ServiceRateForm
      serviceType={serviceType}
      defaultValues={emptyRateForm(serviceType)}
      onSubmit={submit}
      onCancel={onCancel}
      notices={conflict && <Alert title={conflict} />}
    />
  );
}

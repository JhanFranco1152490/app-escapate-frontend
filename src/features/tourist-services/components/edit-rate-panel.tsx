'use client';

import { StaleVersionNotice } from '@/components/stale-version-notice';
import { useVersionedEdit } from '@/lib/use-versioned-edit';

import type { ServiceType } from '../api';
import { useUpdateRate, type ServiceRate } from '../rate-api';
import { rateFormValues } from '../rate-form-values';
import type { RatePayload } from '../rate-schemas';
import { ServiceRateForm } from './service-rate-form';

type EditRatePanelProps = {
  serviceId: number;
  serviceType: ServiceType;
  rate: ServiceRate;
  // Vuelve a pedir la tabla y da la tarifa como quedó.
  reloadRate: () => Promise<{ data?: ServiceRate }>;
  onSaved: () => void;
  onCancel: () => void;
};

export function EditRatePanel({
  serviceId,
  serviceType,
  rate,
  reloadRate,
  onSaved,
  onCancel,
}: EditRatePanelProps) {
  const updateRate = useUpdateRate(serviceId);
  const { opened, stale, reloading, save, reload } = useVersionedEdit(
    rate,
    reloadRate,
  );

  const submit = async (payload: RatePayload) => {
    const saved = await save((version) =>
      updateRate.mutateAsync({
        rateId: rate.id,
        body: { ...payload, expected_version: version },
      }),
    );
    if (saved) onSaved();
  };

  return (
    // La clave cambia con la versión: al recargar, el formulario se arma con la tarifa nueva
    // en vez de mezclarla con lo escrito.
    <ServiceRateForm
      key={opened.version}
      serviceType={serviceType}
      defaultValues={rateFormValues(opened)}
      onSubmit={submit}
      onCancel={onCancel}
      notices={
        stale && (
          <StaleVersionNotice
            message={stale}
            onReload={() => void reload()}
            reloading={reloading}
          />
        )
      }
    />
  );
}

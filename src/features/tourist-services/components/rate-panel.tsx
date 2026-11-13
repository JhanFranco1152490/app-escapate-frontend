'use client';

import type { ServiceType } from '../api';
import type { ServiceRate } from '../rate-api';
import { CreateRatePanel } from './create-rate-panel';
import { EditRatePanel } from './edit-rate-panel';

export type RatePanelState =
  { mode: 'create' } | { mode: 'edit'; rate: ServiceRate };

type RatePanelProps = {
  state: RatePanelState;
  serviceId: number;
  serviceType: ServiceType;
  // Vuelve a pedir la tabla y da la tarifa que se edita como quedó.
  reloadRate: (rateId: number) => () => Promise<{ data?: ServiceRate }>;
  onSaved: (text: string) => void;
  onClose: () => void;
};

// El formulario de una tarifa, junto a la tabla: alta o edición de la que se eligió.
export function RatePanel({
  state,
  serviceId,
  serviceType,
  reloadRate,
  onSaved,
  onClose,
}: RatePanelProps) {
  return (
    <aside
      aria-labelledby="rate-panel-title"
      className="flex flex-col gap-4 border-t px-5 py-5 lg:border-t-0 lg:border-l"
    >
      <h3
        id="rate-panel-title"
        className="font-heading text-base font-semibold"
      >
        {state.mode === 'create' ? 'Nueva tarifa' : 'Editar tarifa'}
      </h3>
      {state.mode === 'create' ? (
        <CreateRatePanel
          serviceId={serviceId}
          serviceType={serviceType}
          onSaved={() => onSaved('Tarifa registrada.')}
          onCancel={onClose}
        />
      ) : (
        // Otra tarifa elegida es otro formulario: no se mezclan los valores.
        <EditRatePanel
          key={state.rate.id}
          serviceId={serviceId}
          serviceType={serviceType}
          rate={state.rate}
          reloadRate={reloadRate(state.rate.id)}
          onSaved={() => onSaved('Tarifa actualizada.')}
          onCancel={onClose}
        />
      )}
    </aside>
  );
}

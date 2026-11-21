'use client';

import { useState } from 'react';

import { SearchInput } from '@/components/search-input';
import { Button } from '@/components/ui/button';
import { formatAmountInput, formatRateAmount } from '@/lib/format/money';

import { useOffer, type OfferRate, type OfferService } from '../api';
import type { ItemFormApi } from '../schemas';
import { CHARGE_UNIT_LABELS, SERVICE_TYPE_LABELS } from '../service-options';

// Elegir una tarifa vigente de la oferta llena el servicio con sus datos: tipo, nombre,
// proveedor, unidad, moneda y costo. El asesor luego ajusta lo que necesite.
export function OfferPicker({ form }: { form: ItemFormApi }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const offer = useOffer({ q, serviceType: null, page: 1 }, open);

  const pick = (service: OfferService, rate: OfferRate) => {
    const set = (name: Parameters<ItemFormApi['setValue']>[0], value: string) =>
      form.setValue(name, value, { shouldDirty: true });
    set('service_type', service.service_type);
    set('tourist_service_id', String(service.id));
    set('name', `${service.name} · ${rate.name}`);
    set('details', service.description ?? '');
    set('charge_unit', rate.charge_unit);
    set('currency', rate.currency);
    set('unit_cost', formatAmountInput(rate.amount, rate.currency));
    setOpen(false);
  };

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Elegir de la oferta turística
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border p-3">
      <SearchInput
        label="Buscar en la oferta"
        placeholder="Servicio, destino o proveedor"
        maxLength={100}
        value={q}
        onValueChange={setQ}
      />
      <ul className="flex max-h-72 flex-col divide-y overflow-y-auto">
        {offer.data?.results.length === 0 && (
          <li className="py-3 text-sm text-muted-foreground">
            No hay servicios activos que coincidan.
          </li>
        )}
        {offer.data?.results.map((service) => (
          <li key={service.id} className="flex flex-col gap-1.5 py-2.5">
            <p className="text-sm font-medium">
              {service.name}
              <span className="ml-2 text-xs text-muted-foreground">
                {SERVICE_TYPE_LABELS[service.service_type]} ·{' '}
                {service.destination} · {service.supplier.trade_name}
              </span>
            </p>
            {service.rates.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Sin tarifas vigentes.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {service.rates.map((rate) => (
                  <Button
                    key={rate.id}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => pick(service, rate)}
                  >
                    {rate.name}: {formatRateAmount(rate.amount, rate.currency)}{' '}
                    {CHARGE_UNIT_LABELS[rate.charge_unit]}
                  </Button>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
        Cerrar
      </Button>
    </div>
  );
}

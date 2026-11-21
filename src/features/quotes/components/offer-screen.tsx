'use client';

import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { SearchInput } from '@/components/search-input';
import { TableSkeleton } from '@/components/table-skeleton';
import { Label } from '@/components/ui/label';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { formatShortDate } from '@/lib/format/dates';
import { formatRateAmount } from '@/lib/format/money';

import { useOffer, type ServiceType } from '../api';
import { CHARGE_UNIT_LABELS, SERVICE_TYPE_LABELS } from '../service-options';

const TYPES = Object.keys(SERVICE_TYPE_LABELS) as ServiceType[];

// La oferta turística disponible para cotizar: servicios activos de proveedores activos, con
// sus tarifas vigentes hoy.
export function OfferScreen() {
  const [{ q, type }, setValues] = useQueryStates(
    {
      q: parseAsString.withDefault(''),
      type: parseAsStringLiteral(TYPES),
    },
    { history: 'replace' },
  );
  const offer = useOffer({ q: q.trim(), serviceType: type, page: 1 });

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Oferta turística / 03"
        title="Oferta disponible"
        description="Lo que se puede cotizar hoy: servicios activos con sus tarifas vigentes."
      />
      <div className="grid gap-4 md:grid-cols-[1fr_16rem] md:items-end">
        <SearchInput
          label="Buscar en la oferta"
          placeholder="Servicio, destino o proveedor"
          maxLength={100}
          value={q}
          onValueChange={(value) => void setValues({ q: value || null })}
        />
        <div className="flex flex-col gap-2">
          <Label htmlFor="offer-type">Tipo de servicio</Label>
          <NativeSelect
            id="offer-type"
            className="w-full"
            value={type ?? ''}
            onChange={(event) =>
              void setValues({
                type: (event.target.value || null) as ServiceType | null,
              })
            }
          >
            <NativeSelectOption value="">Todos</NativeSelectOption>
            {TYPES.map((code) => (
              <NativeSelectOption key={code} value={code}>
                {SERVICE_TYPE_LABELS[code]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </div>
      {!offer.data ? (
        <TableSkeleton label="Cargando la oferta" />
      ) : offer.data.results.length === 0 ? (
        <EmptyState title="Sin resultados">
          No hay servicios activos que coincidan con la búsqueda.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {offer.data.results.map((service) => (
            <li
              key={service.id}
              className="flex flex-col gap-2 rounded-md border bg-card px-5 py-4"
            >
              <p className="font-mono text-[0.625rem] tracking-[0.16em] text-orange-600 uppercase">
                {SERVICE_TYPE_LABELS[service.service_type]} ·{' '}
                {service.destination}
              </p>
              <p className="font-heading text-base font-semibold">
                {service.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {service.supplier.trade_name}
              </p>
              {service.rates.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sin tarifas vigentes.
                </p>
              ) : (
                <ul className="flex flex-col gap-1 text-sm">
                  {service.rates.map((rate) => (
                    <li key={rate.id} className="flex justify-between gap-3">
                      <span>
                        {rate.name}
                        {rate.valid_until &&
                          ` (hasta ${formatShortDate(rate.valid_until)})`}
                      </span>
                      <span className="font-medium">
                        {formatRateAmount(rate.amount, rate.currency)}{' '}
                        {CHARGE_UNIT_LABELS[rate.charge_unit]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import type { ReactNode } from 'react';

import { StatusBadge } from '@/components/status-badge';
import { formatShortDate } from '@/lib/format/dates';
import { formatRateAmount } from '@/lib/format/money';

import type { ServiceRate } from '../rate-api';
import { CHARGE_UNIT_LABELS, RATE_VALIDITY } from '../rate-options';

const headerCell =
  'h-10.5 px-4 text-left font-mono text-[0.59375rem] font-normal tracking-[0.16em] text-muted-foreground uppercase';
// Por debajo de md cada fila es una tarjeta: mismo marcado, sin una segunda copia de los
// datos para celular.
const cell = 'px-4 md:py-3 align-top';
const secondary = 'block text-[0.75rem] text-muted-foreground';

function Validity({ rate }: { rate: ServiceRate }) {
  const from = formatShortDate(rate.valid_from);
  if (!rate.valid_until) {
    return (
      <>
        <span className="block">Desde {from}</span>
        <span className={secondary}>Sin fecha de fin</span>
      </>
    );
  }
  return <span>{`${from} – ${formatShortDate(rate.valid_until)}`}</span>;
}

type ServiceRatesTableProps = {
  rates: ServiceRate[];
  // Editar y borrar, para quien gestiona el servicio.
  actions?: (rate: ServiceRate) => ReactNode;
};

// El orden lo da la API: vigentes, luego próximas y al final vencidas.
export function ServiceRatesTable({ rates, actions }: ServiceRatesTableProps) {
  return (
    <table className="w-full text-sm md:table-fixed">
      <colgroup className="max-md:hidden">
        <col />
        <col className="w-[28%]" />
        <col className="w-[13%]" />
        <col className="w-[22%]" />
        {actions && <col className="w-40" />}
      </colgroup>
      <thead className="bg-muted/60 max-md:sr-only">
        <tr>
          <th scope="col" className={headerCell}>
            Tarifa
          </th>
          <th scope="col" className={headerCell}>
            Vigencia
          </th>
          <th scope="col" className={headerCell}>
            Estado
          </th>
          <th scope="col" className={headerCell}>
            Valor
          </th>
          {actions && (
            <th scope="col" className={headerCell}>
              <span className="sr-only">Acciones</span>
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {rates.map((rate) => {
          const validity = RATE_VALIDITY[rate.validity_status];
          return (
            <tr
              key={rate.id}
              className="border-t max-md:flex max-md:flex-col max-md:gap-1.5 max-md:py-3.5"
            >
              <td className={`${cell} min-w-0`}>
                <span className="block font-medium">{rate.name}</span>
                {rate.conditions && (
                  <span className={secondary}>{rate.conditions}</span>
                )}
              </td>
              <td className={cell}>
                <Validity rate={rate} />
              </td>
              <td className={cell}>
                <StatusBadge label={validity.label} tone={validity.tone} />
              </td>
              <td className={cell}>
                <span className="block font-mono">
                  {formatRateAmount(rate.amount, rate.currency)}
                </span>
                <span className={secondary}>
                  {CHARGE_UNIT_LABELS[rate.charge_unit]}
                </span>
              </td>
              {actions && (
                <td className={`${cell} md:text-right`}>{actions(rate)}</td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

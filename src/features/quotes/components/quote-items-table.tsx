import { formatDateRange, formatShortDate } from '@/lib/format/dates';
import {
  formatMoney,
  formatPercentage,
  formatRateAmount,
} from '@/lib/format/money';

import type { QuoteItem } from '../api';
import { CHARGE_UNIT_LABELS, SERVICE_TYPE_LABELS } from '../service-options';

const headerCell =
  'h-10.5 px-4 text-left font-mono text-[0.59375rem] font-normal tracking-[0.16em] text-muted-foreground uppercase';
const cell = 'px-4 py-3 align-top';
const subline = 'block font-mono text-[0.6875rem] text-muted-foreground';

function itemDates(item: QuoteItem) {
  if (item.start_date && item.end_date)
    return formatDateRange(item.start_date, item.end_date);
  if (item.start_date) return formatShortDate(item.start_date);
  return null;
}

type QuoteItemsTableProps = {
  items: QuoteItem[];
  // Las acciones de cada fila (editar y quitar), solo mientras la cotización es borrador.
  actions?: (item: QuoteItem) => React.ReactNode;
};

export function QuoteItemsTable({ items, actions }: QuoteItemsTableProps) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-muted/60 max-md:sr-only">
        <tr>
          <th scope="col" className={headerCell}>
            Servicio
          </th>
          <th scope="col" className={headerCell}>
            Cantidad
          </th>
          <th scope="col" className={headerCell}>
            Costo
          </th>
          <th scope="col" className={headerCell}>
            %
          </th>
          <th scope="col" className={headerCell}>
            Precio
          </th>
          {actions && (
            <th scope="col" className={headerCell}>
              <span className="sr-only">Acciones</span>
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const dates = itemDates(item);
          return (
            <tr
              key={item.id}
              className="border-t max-md:flex max-md:flex-col max-md:gap-1 max-md:py-3"
            >
              <td className={`${cell} min-w-0`}>
                <span className="block font-medium">
                  {item.name}
                  {item.is_optional && (
                    <span className="ml-2 font-mono text-[0.625rem] tracking-[0.12em] text-orange-600 uppercase">
                      Opcional
                    </span>
                  )}
                </span>
                <span className={subline}>
                  {SERVICE_TYPE_LABELS[item.service_type]}
                  {item.supplier && ` · ${item.supplier.trade_name}`}
                  {dates && ` · ${dates}`}
                </span>
              </td>
              <td className={`${cell} text-muted-foreground`}>
                {item.quantity}{' '}
                {item.charge_unit &&
                  CHARGE_UNIT_LABELS[item.charge_unit].replace(/^por /, '')}
              </td>
              <td className={cell}>
                {formatRateAmount(item.unit_cost, item.currency)}
                {item.charge_unit && (
                  <span className={subline}>
                    {CHARGE_UNIT_LABELS[item.charge_unit]}
                  </span>
                )}
              </td>
              <td className={`${cell} text-muted-foreground`}>
                {formatPercentage(item.markup_percent)}
              </td>
              <td className={`${cell} font-medium`}>
                {item.sale_price === null
                  ? 'Falta la tasa'
                  : formatMoney(item.sale_price)}
                {item.sale_price_override !== null && (
                  <span className={subline}>Escrito a mano</span>
                )}
              </td>
              {actions && (
                <td className={`${cell} md:text-right`}>{actions(item)}</td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

'use client';

import { RotateCcw } from 'lucide-react';
import Link from 'next/link';
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';

import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { FilterTabs } from '@/components/filter-tabs';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { SearchInput } from '@/components/search-input';
import { TableSkeleton } from '@/components/table-skeleton';
import { Button } from '@/components/ui/button';
import { formatDateRange, formatShortDate } from '@/lib/format/dates';
import { formatMoney } from '@/lib/format/money';

import { SALES_PAGE_SIZE, useSales, type PaymentStatus } from '../api';
import { PaymentStatusBadge } from './payment-status-badge';

const STATUSES = ['pending', 'partial', 'paid'] as const;
const parsers = {
  q: parseAsString.withDefault(''),
  status: parseAsStringLiteral(STATUSES),
  page: parseAsInteger.withDefault(1),
};

const TABS: { label: string; value: PaymentStatus | null }[] = [
  { label: 'Todas', value: null },
  { label: 'Sin pagos', value: 'pending' },
  { label: 'Con abonos', value: 'partial' },
  { label: 'Pagadas', value: 'paid' },
];

const headerCell =
  'h-10.5 px-4 text-left font-mono text-[0.59375rem] font-normal tracking-[0.16em] text-muted-foreground uppercase';
const cell = 'px-4 py-3';

export function SalesScreen() {
  const [{ q, status, page }, setValues] = useQueryStates(parsers, {
    history: 'replace',
  });
  const sales = useSales({
    q: q.trim(),
    paymentStatus: status,
    quoteId: null,
    page: Math.max(page, 1),
  });

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Operación / 08"
        title="Ventas y pagos"
        description="Los viajes vendidos, lo que el cliente ha pagado y su saldo. Una venta se registra desde la cotización aceptada."
      />
      <div className="flex flex-col gap-4">
        <div className="overflow-x-auto">
          <FilterTabs
            label="Estado del pago"
            tabs={TABS}
            value={status}
            onChange={(value) => void setValues({ status: value, page: null })}
          />
        </div>
        <SearchInput
          label="Buscar venta"
          placeholder="Código, cliente o destino"
          maxLength={100}
          value={q}
          onValueChange={(value) =>
            void setValues({ q: value || null, page: null })
          }
        />
      </div>
      {sales.isError ? (
        <ErrorState
          title="No pudimos cargar las ventas"
          action={
            <Button onClick={() => void sales.refetch()}>
              <RotateCcw aria-hidden="true" />
              Reintentar
            </Button>
          }
        >
          Se interrumpió la conexión con el servidor. Inténtalo de nuevo en un
          momento.
        </ErrorState>
      ) : sales.data?.results.length === 0 ? (
        <EmptyState title="No hay ventas aquí">
          Cuando un cliente acepte una cotización, regístrala como venta desde
          su ficha.
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-md border bg-card">
          {sales.data ? (
            <>
              <table className="w-full text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    {[
                      'Venta',
                      'Cliente',
                      'Viaje',
                      'Total',
                      'Saldo',
                      'Pago',
                    ].map((header) => (
                      <th key={header} scope="col" className={headerCell}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sales.data.results.map((sale) => (
                    <tr key={sale.id} className="border-t">
                      <td className={`${cell} font-mono text-[0.75rem]`}>
                        <Link
                          href={`/ventas/${sale.id}`}
                          className="font-medium underline-offset-4 hover:underline"
                        >
                          {sale.code}
                        </Link>
                      </td>
                      <td className={cell}>{sale.client.display_name}</td>
                      <td className={cell}>
                        {sale.destination}
                        <span className="block font-mono text-[0.6875rem] text-muted-foreground">
                          {sale.departure_date && sale.return_date
                            ? formatDateRange(
                                sale.departure_date,
                                sale.return_date,
                              )
                            : sale.departure_date
                              ? formatShortDate(sale.departure_date)
                              : 'Sin fechas'}
                        </span>
                      </td>
                      <td className={cell}>{formatMoney(sale.total_price)}</td>
                      <td className={`${cell} font-medium`}>
                        {formatMoney(sale.balance)}
                      </td>
                      <td className={cell}>
                        <PaymentStatusBadge status={sale.payment_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                page={page}
                pageSize={SALES_PAGE_SIZE}
                count={sales.data.count}
                hasPrevious={sales.data.previous !== null}
                hasNext={sales.data.next !== null}
                onPageChange={(next) =>
                  void setValues({ page: next > 1 ? next : null })
                }
              />
            </>
          ) : (
            <TableSkeleton label="Cargando ventas" />
          )}
        </div>
      )}
    </div>
  );
}

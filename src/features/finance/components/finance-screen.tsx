'use client';

import { parseAsString, useQueryStates } from 'nuqs';

import { DetailItem } from '@/components/detail-item';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { todayInBogota } from '@/lib/format/dates';
import { formatMoney } from '@/lib/format/money';

import { useFinanceSummary, type ExpenseCategory } from '../api';
import { CATEGORY_LABELS, ExpensesSection } from './expenses-section';

const MONTHS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

// "2026-11" → "nov 2026".
const monthLabel = (month: string) =>
  `${MONTHS[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;

const sectionClass = 'rounded-md border bg-card';
const titleClass = 'border-b px-5 py-4 font-heading text-lg font-semibold';
const headerCell =
  'h-10.5 px-4 text-left font-mono text-[0.59375rem] font-normal tracking-[0.16em] text-muted-foreground uppercase';

// Ingresos y egresos de la agencia en un período (por defecto, lo que va del año), por mes y
// por categoría de gasto, y los gastos operativos.
export function FinanceScreen() {
  const today = todayInBogota();
  const [period, setPeriod] = useQueryStates(
    {
      from: parseAsString.withDefault(`${today.slice(0, 4)}-01-01`),
      to: parseAsString.withDefault(today),
    },
    { history: 'replace' },
  );
  const summary = useFinanceSummary(period);
  const data = summary.data;

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Finanzas / 01"
        title="Ingresos y egresos"
        description="Lo que entró de los clientes y lo que salió a proveedores y en gastos de la agencia, por fecha de pago."
      />
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="period-from">Desde</Label>
          <Input
            id="period-from"
            type="date"
            className="h-11"
            value={period.from}
            onChange={(event) => void setPeriod({ from: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="period-to">Hasta</Label>
          <Input
            id="period-to"
            type="date"
            className="h-11"
            value={period.to}
            onChange={(event) => void setPeriod({ to: event.target.value })}
          />
        </div>
      </div>
      {data && (
        <>
          <section className={sectionClass} aria-labelledby="totals-title">
            <h2 id="totals-title" className={titleClass}>
              Totales del período
            </h2>
            <dl className="grid gap-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-5">
              <DetailItem term="Ingresos">
                {formatMoney(data.income)}
              </DetailItem>
              <DetailItem term="Pagos a proveedores">
                {formatMoney(data.supplier_payments)}
              </DetailItem>
              <DetailItem term="Gastos operativos">
                {formatMoney(data.operating_expenses)}
              </DetailItem>
              <DetailItem term="Egresos">
                {formatMoney(data.expenses)}
              </DetailItem>
              <DetailItem term="Resultado">
                <span
                  className={`text-base font-semibold ${data.net < 0 ? 'text-destructive' : ''}`}
                >
                  {formatMoney(data.net)}
                </span>
              </DetailItem>
            </dl>
          </section>
          <section
            className={`${sectionClass} overflow-x-auto`}
            aria-labelledby="months-title"
          >
            <h2 id="months-title" className={titleClass}>
              Por mes
            </h2>
            {data.by_month.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                No hay movimientos en este período.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    {[
                      'Mes',
                      'Ingresos',
                      'Proveedores',
                      'Gastos',
                      'Resultado',
                    ].map((header) => (
                      <th key={header} scope="col" className={headerCell}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.by_month.map((row) => (
                    <tr key={row.month} className="border-t">
                      <td className="px-4 py-3">{monthLabel(row.month)}</td>
                      <td className="px-4 py-3">{formatMoney(row.income)}</td>
                      <td className="px-4 py-3">
                        {formatMoney(row.supplier_payments)}
                      </td>
                      <td className="px-4 py-3">
                        {formatMoney(row.operating_expenses)}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatMoney(row.net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
          <section className={sectionClass} aria-labelledby="categories-title">
            <h2 id="categories-title" className={titleClass}>
              Gastos por categoría
            </h2>
            <dl className="grid gap-5 px-5 py-5 sm:grid-cols-3 lg:grid-cols-7">
              {Object.entries(data.by_category).map(([category, amount]) => (
                <DetailItem
                  key={category}
                  term={CATEGORY_LABELS[category as ExpenseCategory]}
                >
                  {formatMoney(amount ?? 0)}
                </DetailItem>
              ))}
            </dl>
          </section>
        </>
      )}
      <ExpensesSection period={period} />
    </div>
  );
}

'use client';

import { Download } from 'lucide-react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';

import { EmptyState } from '@/components/empty-state';
import { FilterTabs } from '@/components/filter-tabs';
import { PageHeader } from '@/components/page-header';
import { TableSkeleton } from '@/components/table-skeleton';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/format/money';

import { useReport, type ReportKind } from '../api';
import { downloadCsv } from '../csv';
import { PeriodFields, usePeriod } from './period-fields';

const KINDS = ['sales', 'payments', 'quotes', 'requests', 'expenses'] as const;

const TABS: { label: string; value: ReportKind }[] = [
  { label: 'Ventas', value: 'sales' },
  { label: 'Pagos de clientes', value: 'payments' },
  { label: 'Cotizaciones', value: 'quotes' },
  { label: 'Solicitudes', value: 'requests' },
  { label: 'Gastos operativos', value: 'expenses' },
];

// Columnas de dinero: se muestran en pesos en pantalla, en el archivo van como número.
const MONEY_COLUMNS = new Set(['Total', 'Pagado', 'Saldo', 'Valor', 'Precio']);

const headerCell =
  'h-10.5 px-4 text-left font-mono text-[0.59375rem] font-normal tracking-[0.16em] text-muted-foreground uppercase';

export function ReportsScreen() {
  const [kind, setKind] = useQueryState(
    'kind',
    parseAsStringLiteral(KINDS).withDefault('sales'),
  );
  const [period, setPeriod] = usePeriod();
  const report = useReport(kind, period).data;

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Reportes / 02"
        title="Reportes"
        description="Elige qué y de cuándo, revísalo aquí y expórtalo a Excel (CSV)."
        actions={
          report && (
            <Button
              disabled={report.rows.length === 0}
              onClick={() =>
                downloadCsv(report, `${kind}-${period.from}-a-${period.to}.csv`)
              }
            >
              <Download aria-hidden="true" />
              Exportar CSV
            </Button>
          )
        }
      />
      <div className="overflow-x-auto">
        <FilterTabs
          label="Tipo de reporte"
          tabs={TABS}
          value={kind}
          onChange={(value) => void setKind(value)}
        />
      </div>
      <PeriodFields
        period={period}
        onChange={(patch) => void setPeriod(patch)}
      />
      {!report ? (
        <TableSkeleton label="Generando el reporte" />
      ) : report.rows.length === 0 ? (
        <EmptyState title="Sin datos">
          No hay registros de este tipo en el período elegido.
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-md border bg-card">
          <p className="border-b px-5 py-3 text-sm text-muted-foreground">
            {report.title}: {report.rows.length} registros
          </p>
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr>
                {report.columns.map((column) => (
                  <th key={column} scope="col" className={headerCell}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row, index) => (
                <tr key={index} className="border-t">
                  {row.map((value, column) => (
                    <td key={column} className="px-4 py-2.5 whitespace-nowrap">
                      {typeof value === 'number' &&
                      MONEY_COLUMNS.has(report.columns[column])
                        ? formatMoney(value)
                        : (value ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

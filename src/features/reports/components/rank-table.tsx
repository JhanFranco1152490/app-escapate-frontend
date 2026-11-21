import { formatMoney } from '@/lib/format/money';

import type { RankRow } from '../api';

type RankTableProps = {
  title: string;
  rows: RankRow[];
  // Qué mide la barra: el monto vendido o el número de ventas.
  measure: 'amount' | 'count';
  countLabel: string;
};

// Un ranking como tabla con una barra de un solo color: la barra compara, el número exacto
// siempre está escrito al lado.
export function RankTable({
  title,
  rows,
  measure,
  countLabel,
}: RankTableProps) {
  const max = Math.max(1, ...rows.map((row) => row[measure]));
  return (
    <section className="rounded-md border bg-card">
      <h3 className="border-b px-5 py-3 font-heading text-base font-semibold">
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="px-5 py-5 text-sm text-muted-foreground">
          Sin datos en el período.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead className="sr-only">
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">{countLabel}</th>
              {measure === 'amount' && <th scope="col">Monto</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                className="border-t first:border-t-0"
                title={`${row.label}: ${row.count} ${countLabel.toLowerCase()}${
                  measure === 'amount' ? ` · ${formatMoney(row.amount)}` : ''
                }`}
              >
                <td className="w-2/5 px-5 py-2.5">
                  <span className="block truncate">{row.label}</span>
                  <span
                    aria-hidden="true"
                    className="mt-1 block h-2 rounded-r bg-orange-500"
                    style={{ width: `${(row[measure] / max) * 100}%` }}
                  />
                </td>
                <td className="px-5 py-2.5 text-right text-muted-foreground tabular-nums">
                  {row.count}
                </td>
                {measure === 'amount' && (
                  <td className="px-5 py-2.5 text-right font-medium tabular-nums">
                    {formatMoney(row.amount)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

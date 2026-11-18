import type { TravelRequestSummary } from '../api';

// Cuántas esperan propuesta, cuántas ya tienen un borrador empezado y cuántas llevan más de
// tres días: lo primero que mira el asesor para decidir por dónde empezar.
export function PendingSummary({
  summary,
}: {
  summary: TravelRequestSummary | undefined;
}) {
  const cards = [
    { label: 'Pendientes', value: summary?.pending },
    { label: 'Con borrador iniciado', value: summary?.by_status.quoting },
    { label: 'Esperan más de 3 días', value: summary?.pending_over_3_days },
  ];

  return (
    <ul
      aria-label="Resumen de pendientes"
      className="grid gap-3 sm:grid-cols-3"
    >
      {cards.map((card) => (
        <li
          key={card.label}
          className="flex flex-col gap-1 rounded-md border bg-card px-5 py-4"
        >
          <strong className="font-heading text-[2rem] leading-none font-semibold">
            {card.value ?? '–'}
          </strong>
          <span className="font-mono text-[0.625rem] tracking-[0.16em] text-muted-foreground uppercase">
            {card.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

import Link from 'next/link';
import type { ReactNode } from 'react';

type StatTileProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  // A dónde lleva para atender lo que cuenta.
  href?: string;
  // Algo que necesita atención (vencidos, sin pedir): se marca con borde, además del texto.
  attention?: boolean;
};

// Un indicador como número grande con su nombre: no hace falta un gráfico para un solo dato.
export function StatTile({
  label,
  value,
  hint,
  href,
  attention,
}: StatTileProps) {
  const body = (
    <>
      <p className="font-mono text-[0.625rem] tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="font-heading text-[1.75rem] leading-tight font-semibold tabular-nums">
        {value}
      </p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </>
  );
  const className = `flex flex-col gap-1 rounded-md border bg-card px-5 py-4 ${
    attention ? 'border-orange-400' : ''
  }`;
  return href ? (
    <Link href={href} className={`${className} hover:bg-muted/40`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

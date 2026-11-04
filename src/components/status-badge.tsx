import { cn } from 'cn';

export type StatusTone = 'ok' | 'pending' | 'inactive';

const TONES: Record<StatusTone, { dot: string; text: string }> = {
  ok: { dot: 'bg-[rgb(var(--ok))]', text: 'text-[rgb(var(--ok))]' },
  pending: { dot: 'bg-orange-500', text: 'text-foreground' },
  inactive: {
    dot: 'border border-muted-foreground',
    text: 'text-muted-foreground',
  },
};

// El estado de un registro: el color acompaña a la etiqueta, nunca la reemplaza.
export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: StatusTone;
}) {
  const { dot, text } = TONES[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-[0.625rem] tracking-[0.12em] uppercase',
        text,
      )}
    >
      <span aria-hidden="true" className={cn('size-1.75 rounded-full', dot)} />
      {label}
    </span>
  );
}

import { cn } from 'cn';
import type { ReactNode } from 'react';

// Etiqueta corta junto a un dato ("Menor", "Es el cliente"): un rasgo del registro, no un
// estado que cambia.
export function Tag({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[0.625rem] tracking-[0.12em] whitespace-nowrap uppercase',
        tone === 'accent'
          ? 'border-orange-500/60 text-foreground'
          : 'border-border text-muted-foreground',
      )}
    >
      {children}
    </span>
  );
}

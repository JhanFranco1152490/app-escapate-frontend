import { cn } from 'cn';
import type { ReactNode } from 'react';

type DetailItemProps = {
  term: string;
  children: ReactNode;
  className?: string;
};

// Un dato de una ficha: el nombre arriba, en mayúsculas pequeñas, y el valor debajo. Va dentro
// de un <dl>.
export function DetailItem({ term, children, className }: DetailItemProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <dt className="font-mono text-[0.625rem] tracking-[0.16em] text-muted-foreground uppercase">
        {term}
      </dt>
      <dd className="text-sm break-words">{children}</dd>
    </div>
  );
}

import { cn } from 'cn';
import type { ReactNode } from 'react';

export type AlertVariant = 'error' | 'info';

const variantClasses: Record<AlertVariant, string> = {
  error: 'border-destructive/50 bg-destructive/7',
  info: 'border-border bg-foreground/5',
};

type AlertProps = {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
  className?: string;
};

export function Alert({
  variant = 'error',
  title,
  children,
  className,
}: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border px-4 py-3.5 text-[0.84375rem] leading-normal text-foreground',
        variantClasses[variant],
        className,
      )}
    >
      {title && <p className="font-semibold">{title}</p>}
      {children}
    </div>
  );
}

import type { ReactNode } from 'react';

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-col gap-2">
        <p className="font-mono text-[0.625rem] tracking-[0.2em] text-orange-600 uppercase">
          {eyebrow}
        </p>
        <h1 className="font-heading text-[2rem] leading-tight font-semibold tracking-[-0.03em] break-words md:text-[2.375rem]">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-[0.84375rem] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
}

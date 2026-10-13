import type { ReactNode } from 'react';

type StatePanelProps = {
  illustration: ReactNode;
  title: string;
  children: ReactNode;
  action?: ReactNode;
};

export function StatePanel({
  illustration,
  title,
  children,
  action,
}: StatePanelProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4.5 rounded-xl border bg-card px-6 py-8 text-center sm:px-14">
      {illustration}
      <div className="flex flex-col items-center gap-2.5">
        <h2 className="font-heading text-[1.4375rem] leading-tight font-semibold tracking-[-0.02em]">
          {title}
        </h2>
        <p className="max-w-100 text-[0.84375rem] leading-relaxed text-muted-foreground">
          {children}
        </p>
      </div>
      {action}
    </div>
  );
}

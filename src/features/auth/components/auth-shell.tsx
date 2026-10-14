import type { ReactNode } from 'react';

import { BrandPanel } from './brand-panel';

type AuthShellProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
};

export function AuthShell({ eyebrow, title, children }: AuthShellProps) {
  return (
    <main className="dark-surface flex min-h-dvh bg-navy-950 text-foreground">
      <BrandPanel />
      <section className="flex flex-1 items-center justify-center px-4 py-6 sm:px-12 md:w-96 md:flex-none md:px-10 lg:w-140 lg:px-12">
        <div className="flex w-full max-w-md flex-col gap-4">
          <header>
            <p className="font-mono text-[0.625rem] tracking-[0.2em] text-orange-400 uppercase">
              {eyebrow}
            </p>
            <h1 className="mt-2 font-heading text-[2rem] font-semibold tracking-[-0.03em]">
              {title}
            </h1>
          </header>
          {children}
        </div>
      </section>
    </main>
  );
}

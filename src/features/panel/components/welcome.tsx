'use client';

import { useCurrentUser } from '@/features/auth/components/session-guard';

export function Welcome() {
  const user = useCurrentUser();
  const firstName = user.full_name.trim().split(/\s+/)[0];

  return (
    <section className="flex flex-col gap-3">
      <p className="font-mono text-[0.625rem] tracking-[0.2em] text-orange-600 uppercase">
        Portal de asesores
      </p>
      <h1 className="font-heading text-[2rem] font-semibold tracking-[-0.03em]">
        Hola, {firstName}
      </h1>
      <p className="max-w-xl text-muted-foreground">
        Desde aquí vas a llegar a los módulos de tu rol a medida que estén
        disponibles.
      </p>
    </section>
  );
}

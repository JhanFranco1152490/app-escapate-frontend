import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { LegalLinks } from '@/components/legal-links';
import { buttonVariants } from '@/components/ui/button';

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/acerca" aria-label="Escápate, agencia de viajes">
            <Image
              src="/brand/escapate-logo-color.png"
              alt="Escápate, agencia de viajes"
              width={600}
              height={364}
              className="h-auto w-24"
              priority
            />
          </Link>
          <Link
            href="/iniciar-sesion"
            className={buttonVariants({ variant: 'outline' })}
          >
            Iniciar sesión
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        {children}
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-6 text-muted-foreground">
          <LegalLinks />
          <p className="text-sm">Escápate · San José de Cúcuta, Colombia</p>
        </div>
      </footer>
    </div>
  );
}

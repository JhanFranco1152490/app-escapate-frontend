'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { setResetPrefill } from '../reset-prefill';
import type { DocumentValues } from '../schemas';

type RecoveryLinkProps = {
  getDocument: () => DocumentValues | undefined;
  className?: string;
  children: ReactNode;
};

// Lleva a pedir el enlace con el documento ya escrito. El documento se pasa en memoria y
// nunca en la URL, que queda en el historial del navegador.
export function RecoveryLink({
  getDocument,
  className,
  children,
}: RecoveryLinkProps) {
  return (
    <Link
      href="/recuperar-contrasena"
      className={className}
      onClick={() => {
        const document = getDocument();
        if (document) setResetPrefill(document);
      }}
    >
      {children}
    </Link>
  );
}

'use client';

import type { ReactNode } from 'react';

import { ForbiddenState } from '@/components/forbidden-state';

import { hasPermission } from '../permissions';
import { useCurrentUser } from './session-guard';

type RequirePermissionProps = {
  codes: string[];
  children: ReactNode;
};

// Para las pantallas de otros dominios: quien entra por la URL sin el permiso ve "Sin
// permiso" en vez de una pantalla que fallaría con 403.
export function RequirePermission({ codes, children }: RequirePermissionProps) {
  const user = useCurrentUser();
  const allowed = codes.every((code) => hasPermission(user, code));
  return allowed ? children : <ForbiddenState />;
}

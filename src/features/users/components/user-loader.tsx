'use client';

import { ArrowLeft, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { ErrorState } from '@/components/error-state';
import { ForbiddenState } from '@/components/forbidden-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { isApiError } from '@/lib/api/errors';

import { useUser, type UserDetail } from '../api';
import { UserNotFound } from './user-not-found';

type UserLoaderProps = {
  // null si el id de la URL es imposible: no se pide a la API.
  userId: number | null;
  back: { href: string; label: string };
  children: (user: UserDetail) => ReactNode;
};

// Lo que comparten la ficha y la edición mientras el usuario no está cargado: no encontrado,
// sin permiso, error con "Reintentar" y esqueleto.
export function UserLoader({ userId, back, children }: UserLoaderProps) {
  const user = useUser(userId);
  const errorStatus = isApiError(user.error) ? user.error.status : undefined;

  if (userId === null || errorStatus === 404) return <UserNotFound />;
  if (errorStatus === 403) return <ForbiddenState />;

  return (
    <div className="flex max-w-5xl flex-col gap-7">
      <Link
        href={back.href}
        className="flex min-h-11 w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {back.label}
      </Link>
      {user.data ? (
        children(user.data)
      ) : user.isError ? (
        <ErrorState
          title="No pudimos cargar el usuario"
          action={
            <Button onClick={() => void user.refetch()}>
              <RotateCcw aria-hidden="true" />
              Reintentar
            </Button>
          }
        >
          Se interrumpió la conexión con el servidor. Inténtalo de nuevo en un
          momento.
        </ErrorState>
      ) : (
        <div
          role="status"
          aria-label="Cargando el usuario"
          className="flex flex-col gap-4"
        >
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}
    </div>
  );
}

'use client';

import type { UseQueryResult } from '@tanstack/react-query';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { ErrorState } from '@/components/error-state';
import { ForbiddenState } from '@/components/forbidden-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { isApiError } from '@/lib/api/errors';

type RecordLoaderProps<T> = {
  // false si el id de la URL es imposible: la consulta no se hizo.
  validId: boolean;
  query: UseQueryResult<T>;
  // Sin `back`, la pantalla arma su propia ruta de vuelta con el registro ya cargado (por
  // ejemplo, "Proveedores / Hotel / Servicio").
  back?: { href: string; label: string };
  notFound: ReactNode;
  // "No pudimos cargar el cliente", "Cargando el cliente".
  errorTitle: string;
  loadingLabel: string;
  children: (record: T) => ReactNode;
};

// Lo que comparten la ficha y la edición de un registro mientras no está cargado: no
// encontrado, sin permiso, error con "Reintentar" y esqueleto.
export function RecordLoader<T>({
  validId,
  query,
  back,
  notFound,
  errorTitle,
  loadingLabel,
  children,
}: RecordLoaderProps<T>) {
  const errorStatus = isApiError(query.error) ? query.error.status : undefined;

  if (!validId || errorStatus === 404) return notFound;
  if (errorStatus === 403) return <ForbiddenState />;

  return (
    <div className="flex max-w-5xl flex-col gap-7">
      {back && (
        <Link
          href={back.href}
          className="flex min-h-11 w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {back.label}
        </Link>
      )}
      {query.data ? (
        children(query.data)
      ) : query.isError ? (
        <ErrorState
          title={errorTitle}
          action={
            <Button onClick={() => void query.refetch()}>
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
          aria-label={loadingLabel}
          className="flex flex-col gap-4"
        >
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}
    </div>
  );
}

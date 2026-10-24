'use client';

import { RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';

import { ButtonLink } from '@/components/button-link';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { ForbiddenState } from '@/components/forbidden-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { isApiError } from '@/lib/api/errors';

import {
  usePermissionCatalog,
  useRole,
  type PermissionItem,
  type RoleDetail,
} from '../api';

type RoleLoaderProps = {
  // null si el id de la URL es imposible: no se pide a la API.
  roleId: number | null;
  children: (role: RoleDetail, catalog: PermissionItem[]) => ReactNode;
};

// Lo que se ve mientras el rol o el catálogo no están: no encontrado, sin permiso, error con
// "Reintentar" y esqueleto.
export function RoleLoader({ roleId, children }: RoleLoaderProps) {
  const role = useRole(roleId);
  const catalog = usePermissionCatalog();
  const errorStatus = isApiError(role.error) ? role.error.status : undefined;

  if (roleId === null || errorStatus === 404)
    return (
      <EmptyState
        title="No encontramos este rol"
        action={
          <ButtonLink href="/roles" variant="outline">
            Volver a roles
          </ButtonLink>
        }
      >
        Puede que lo hayan borrado o que el enlace esté mal escrito.
      </EmptyState>
    );
  if (errorStatus === 403) return <ForbiddenState />;
  if (role.data && catalog.data) return children(role.data, catalog.data);
  if (role.isError || catalog.isError)
    return (
      <ErrorState
        title="No pudimos cargar el rol"
        action={
          <Button
            onClick={() => {
              if (role.isError) void role.refetch();
              if (catalog.isError) void catalog.refetch();
            }}
          >
            <RotateCcw aria-hidden="true" />
            Reintentar
          </Button>
        }
      >
        Se interrumpió la conexión con el servidor. Inténtalo de nuevo en un
        momento.
      </ErrorState>
    );
  return (
    <div
      role="status"
      aria-label="Cargando el rol"
      className="flex flex-col gap-3"
    >
      <Skeleton className="h-9 w-64 max-w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

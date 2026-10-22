'use client';

import { RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { ErrorState } from '@/components/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useCreateRole, usePermissionCatalog } from '../api';
import { setRoleNotice } from '../role-notice';
import type { RoleFormValues, RoleValues } from '../schemas';
import { RoleForm } from './role-form';

const EMPTY_ROLE: RoleFormValues = {
  name: '',
  description: '',
  permissions: [],
};

export function CreateRoleScreen() {
  const router = useRouter();
  const catalog = usePermissionCatalog();
  const createRole = useCreateRole();

  const submit = async (values: RoleValues) => {
    const role = await createRole.mutateAsync(values);
    setRoleNotice({ roleId: role.id, text: 'Rol creado.' });
    router.push(`/roles/${role.id}`);
  };

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-heading text-[1.4375rem] leading-tight font-semibold">
        Nuevo rol
      </h2>
      {catalog.isError ? (
        <ErrorState
          title="No pudimos cargar los permisos"
          action={
            <Button onClick={() => void catalog.refetch()}>
              <RotateCcw aria-hidden="true" />
              Reintentar
            </Button>
          }
        >
          Se interrumpió la conexión con el servidor. Inténtalo de nuevo en un
          momento.
        </ErrorState>
      ) : catalog.data ? (
        <RoleForm
          catalog={catalog.data}
          defaultValues={EMPTY_ROLE}
          submitLabel="Crear rol"
          cancelHref="/roles"
          onSubmit={submit}
        />
      ) : (
        <div
          role="status"
          aria-label="Cargando permisos"
          className="flex flex-col gap-3"
        >
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}
    </div>
  );
}

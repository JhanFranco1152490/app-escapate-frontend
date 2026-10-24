'use client';

import { Skeleton } from '@/components/ui/skeleton';

import { usePermissionCatalog, useRole } from '../api';
import { grantsSummary } from '../permission-matrix';

// "Qué podrá hacer" una persona con este rol. Pensado para otros dominios (la pantalla de
// cambiar el rol de un usuario): carga el rol y el catálogo por su cuenta.
export function RoleGrants({ roleId }: { roleId: number }) {
  const role = useRole(roleId);
  const catalog = usePermissionCatalog();

  if (role.isError || catalog.isError)
    return (
      <p className="text-[0.84375rem] text-muted-foreground">
        No pudimos cargar lo que autoriza este rol.
      </p>
    );
  if (!role.data || !catalog.data)
    return (
      <div
        role="status"
        aria-label="Cargando permisos"
        className="flex flex-col gap-2"
      >
        <Skeleton className="h-3.5 w-48" />
        <Skeleton className="h-3.5 w-36" />
      </div>
    );

  const grants = grantsSummary(role.data.permissions, catalog.data);
  if (grants.length === 0)
    return <p className="text-[0.84375rem]">Solo verá la página principal.</p>;
  return (
    <ul className="flex flex-col gap-2 text-[0.84375rem]">
      {grants.map((line) => (
        <li key={line} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-orange-500"
          />
          {line}
        </li>
      ))}
    </ul>
  );
}

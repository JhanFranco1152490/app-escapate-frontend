'use client';

import { Plus, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { ForbiddenState } from '@/components/forbidden-state';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { Button, buttonVariants } from '@/components/ui/button';
import { useHasPermission } from '@/features/auth/permissions';
import { isApiError } from '@/lib/api/errors';

import { USERS_PAGE_SIZE, useUsers } from '../api';
import { useUserFilters } from '../use-user-filters';
import { UsersFilters } from './users-filters';
import { UsersTable } from './users-table';
import { UsersTableSkeleton } from './users-table-skeleton';

export function UsersScreen() {
  const canManage = useHasPermission('users.manage');
  const { search, filters, hasFilters, setFilter, setPage, clearFilters } =
    useUserFilters();
  const users = useUsers(filters);
  const errorStatus = isApiError(users.error) ? users.error.status : undefined;
  // La página pedida ya no existe (por ejemplo, se desactivó el último usuario de la última
  // página con el filtro "Activos"): se vuelve a la primera en vez de mostrar un error.
  const pageOutOfRange = errorStatus === 404 && filters.page > 1;

  useEffect(() => {
    if (pageOutOfRange) setPage(1);
  }, [pageOutOfRange, setPage]);

  if (errorStatus === 403) return <ForbiddenState />;

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Administración / 02"
        title="Usuarios"
        description="Personas autorizadas para operar el panel. Desactivar una cuenta bloquea el acceso y conserva todo su historial."
        actions={
          canManage && (
            <Link href="/usuarios/nuevo" className={buttonVariants()}>
              <Plus aria-hidden="true" />
              Nuevo usuario
            </Link>
          )
        }
      />
      <UsersFilters
        search={search}
        status={filters.status}
        roleId={filters.roleId}
        onChange={setFilter}
      />
      {users.isError && !pageOutOfRange ? (
        <ErrorState
          title="No pudimos cargar los usuarios"
          action={
            <Button onClick={() => void users.refetch()}>
              <RotateCcw aria-hidden="true" />
              Reintentar
            </Button>
          }
        >
          Se interrumpió la conexión con el servidor. Inténtalo de nuevo en un
          momento.
        </ErrorState>
      ) : users.data && users.data.results.length === 0 ? (
        <EmptyState
          title="No hay usuarios que coincidan con la búsqueda"
          action={
            hasFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )
          }
        >
          Prueba con otro nombre o documento, o cambia los filtros de estado y
          rol.
        </EmptyState>
      ) : (
        <div
          aria-busy={users.isFetching}
          className="overflow-hidden rounded-md border bg-card aria-busy:opacity-70"
        >
          {users.data ? (
            <>
              <UsersTable users={users.data.results} />
              <Pagination
                page={filters.page}
                pageSize={USERS_PAGE_SIZE}
                count={users.data.count}
                hasPrevious={users.data.previous !== null}
                hasNext={users.data.next !== null}
                onPageChange={setPage}
              />
            </>
          ) : (
            <UsersTableSkeleton />
          )}
        </div>
      )}
    </div>
  );
}

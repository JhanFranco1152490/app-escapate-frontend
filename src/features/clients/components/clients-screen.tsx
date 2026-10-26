'use client';

import { Plus, RotateCcw } from 'lucide-react';
import { useEffect } from 'react';

import { ButtonLink } from '@/components/button-link';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { ForbiddenState } from '@/components/forbidden-state';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { TableSkeleton } from '@/components/table-skeleton';
import { Button } from '@/components/ui/button';
import { useHasPermission } from '@/features/auth/permissions';
import { isApiError } from '@/lib/api/errors';

import { CLIENTS_PAGE_SIZE, useClients } from '../api';
import { useClientFilters } from '../use-client-filters';
import { ClientsFilters } from './clients-filters';
import { ClientsTable } from './clients-table';

function NewClientLink() {
  return (
    <ButtonLink href="/clientes/nuevo">
      <Plus aria-hidden="true" />
      Nuevo cliente
    </ButtonLink>
  );
}

export function ClientsScreen() {
  const canManage = useHasPermission('clients.manage');
  const { search, filters, hasFilters, setFilter, setPage, clearFilters } =
    useClientFilters();
  const clients = useClients(filters);
  const errorStatus = isApiError(clients.error)
    ? clients.error.status
    : undefined;
  // La página pedida ya no existe (por ejemplo, un enlace viejo): se vuelve a la primera en
  // vez de mostrar un error.
  const pageOutOfRange = errorStatus === 404 && filters.page > 1;

  useEffect(() => {
    if (pageOutOfRange) setPage(1);
  }, [pageOutOfRange, setPage]);

  if (errorStatus === 403) return <ForbiddenState />;

  const isEmpty = clients.data && clients.data.results.length === 0;

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Operación / 02"
        title="Clientes"
        description="Personas, familias y empresas que atiende la agencia. Busca por nombre, documento, correo o teléfono."
        actions={canManage && <NewClientLink />}
      />
      <ClientsFilters
        search={search}
        clientType={filters.clientType}
        onChange={setFilter}
      />
      {clients.isError && !pageOutOfRange ? (
        <ErrorState
          title="No pudimos cargar los clientes"
          action={
            <Button onClick={() => void clients.refetch()}>
              <RotateCcw aria-hidden="true" />
              Reintentar
            </Button>
          }
        >
          Se interrumpió la conexión con el servidor. Inténtalo de nuevo en un
          momento.
        </ErrorState>
      ) : isEmpty && hasFilters ? (
        <EmptyState
          title="No hay clientes que coincidan con la búsqueda"
          action={
            <Button variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          }
        >
          Prueba con otro nombre, documento, correo o teléfono, o cambia el tipo
          de cliente.
        </EmptyState>
      ) : isEmpty ? (
        <EmptyState
          title="Aún no hay clientes registrados"
          action={canManage && <NewClientLink />}
        >
          Cuando registres el primer cliente, aparecerá aquí.
        </EmptyState>
      ) : (
        <div
          aria-busy={clients.isFetching}
          className="overflow-hidden rounded-md border bg-card aria-busy:opacity-70"
        >
          {clients.data ? (
            <>
              <ClientsTable clients={clients.data.results} />
              <Pagination
                page={filters.page}
                pageSize={CLIENTS_PAGE_SIZE}
                count={clients.data.count}
                hasPrevious={clients.data.previous !== null}
                hasNext={clients.data.next !== null}
                onPageChange={setPage}
              />
            </>
          ) : (
            <TableSkeleton label="Cargando clientes" />
          )}
        </div>
      )}
    </div>
  );
}

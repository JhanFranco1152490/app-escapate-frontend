'use client';

import { Plus, RotateCcw } from 'lucide-react';
import { useEffect } from 'react';

import { ButtonLink } from '@/components/button-link';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { ForbiddenState } from '@/components/forbidden-state';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { SearchInput } from '@/components/search-input';
import { TableSkeleton } from '@/components/table-skeleton';
import { Button } from '@/components/ui/button';
import { useHasPermission } from '@/features/auth/permissions';
import { ClientFilterTag } from '@/features/clients/components/client-filter-tag';
import { isApiError } from '@/lib/api/errors';

import { TRAVELERS_PAGE_SIZE, useTravelers } from '../api';
import { useTravelerFilters } from '../use-traveler-filters';
import { TravelersTable } from './travelers-table';

function NewTravelerLink() {
  return (
    <ButtonLink href="/viajeros/nuevo">
      <Plus aria-hidden="true" />
      Nuevo viajero
    </ButtonLink>
  );
}

export function TravelersScreen() {
  const canManage = useHasPermission('travelers.manage');
  const { search, filters, hasFilters, setFilter, setPage, clearFilters } =
    useTravelerFilters();
  const travelers = useTravelers(filters);
  const errorStatus = isApiError(travelers.error)
    ? travelers.error.status
    : undefined;
  // La página pedida ya no existe (por ejemplo, un enlace viejo): se vuelve a la primera en
  // vez de mostrar un error.
  const pageOutOfRange = errorStatus === 404 && filters.page > 1;

  useEffect(() => {
    if (pageOutOfRange) setPage(1);
  }, [pageOutOfRange, setPage]);

  if (errorStatus === 403) return <ForbiddenState />;

  const isEmpty = travelers.data && travelers.data.results.length === 0;

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Operación / 03"
        title="Viajeros"
        description="Quienes realmente viajan. Pueden ser distintos del cliente que compra y sus datos se mantienen por separado."
        actions={canManage && <NewTravelerLink />}
      />
      <div className="flex flex-col gap-3">
        <SearchInput
          label="Buscar viajero"
          placeholder="Nombre o documento"
          maxLength={100}
          value={search}
          onValueChange={(q) => setFilter({ q })}
        />
        {filters.clientId !== null && (
          <ClientFilterTag
            clientId={filters.clientId}
            onRemove={() => setFilter({ client_id: null })}
          />
        )}
      </div>
      {travelers.isError && !pageOutOfRange ? (
        <ErrorState
          title="No pudimos cargar los viajeros"
          action={
            <Button onClick={() => void travelers.refetch()}>
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
          title="No hay viajeros que coincidan con la búsqueda"
          action={
            <Button variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          }
        >
          Prueba con otro nombre o documento, o quita el filtro por cliente.
        </EmptyState>
      ) : isEmpty ? (
        <EmptyState
          title="Aún no hay viajeros registrados"
          action={canManage && <NewTravelerLink />}
        >
          Cuando registres el primer viajero, aparecerá aquí.
        </EmptyState>
      ) : (
        <div
          aria-busy={travelers.isFetching}
          className="overflow-hidden rounded-md border bg-card aria-busy:opacity-70"
        >
          {travelers.data ? (
            <>
              <TravelersTable travelers={travelers.data.results} />
              <Pagination
                page={filters.page}
                pageSize={TRAVELERS_PAGE_SIZE}
                count={travelers.data.count}
                hasPrevious={travelers.data.previous !== null}
                hasNext={travelers.data.next !== null}
                onPageChange={setPage}
              />
            </>
          ) : (
            <TableSkeleton label="Cargando viajeros" />
          )}
        </div>
      )}
    </div>
  );
}

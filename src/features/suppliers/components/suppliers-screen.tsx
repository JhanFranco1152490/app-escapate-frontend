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

import { SUPPLIERS_PAGE_SIZE, useSuppliers } from '../api';
import { useSupplierFilters } from '../use-supplier-filters';
import { SuppliersFilters } from './suppliers-filters';
import { SuppliersTable } from './suppliers-table';

function NewSupplierLink() {
  return (
    <ButtonLink href="/proveedores/nuevo">
      <Plus aria-hidden="true" />
      Nuevo proveedor
    </ButtonLink>
  );
}

export function SuppliersScreen() {
  const canManage = useHasPermission('suppliers.manage');
  const { search, filters, hasFilters, setFilter, setPage, clearFilters } =
    useSupplierFilters();
  const suppliers = useSuppliers(filters);
  const errorStatus = isApiError(suppliers.error)
    ? suppliers.error.status
    : undefined;
  // La página pedida ya no existe (por ejemplo, un enlace viejo): se vuelve a la primera en
  // vez de mostrar un error.
  const pageOutOfRange = errorStatus === 404 && filters.page > 1;

  useEffect(() => {
    if (pageOutOfRange) setPage(1);
  }, [pageOutOfRange, setPage]);

  if (errorStatus === 403) return <ForbiddenState />;

  const isEmpty = suppliers.data && suppliers.data.results.length === 0;

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Oferta turística / 02"
        title="Proveedores"
        description="Hoteles, aerolíneas, operadores y transportes con los que trabaja la agencia. Busca por nombre, documento o contacto."
        actions={canManage && <NewSupplierLink />}
      />
      <SuppliersFilters
        search={search}
        category={filters.category}
        status={filters.status}
        onChange={setFilter}
      />
      {suppliers.isError && !pageOutOfRange ? (
        <ErrorState
          title="No pudimos cargar los proveedores"
          action={
            <Button onClick={() => void suppliers.refetch()}>
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
          title="No hay proveedores que coincidan con la búsqueda"
          action={
            <Button variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          }
        >
          Prueba con otro nombre, documento o contacto, o cambia la
          clasificación o el estado.
        </EmptyState>
      ) : isEmpty ? (
        <EmptyState
          title="Aún no hay proveedores registrados"
          action={canManage && <NewSupplierLink />}
        >
          Cuando registres el primer proveedor, aparecerá aquí.
        </EmptyState>
      ) : (
        <div
          aria-busy={suppliers.isFetching}
          className="overflow-hidden rounded-md border bg-card aria-busy:opacity-70"
        >
          {suppliers.data ? (
            <>
              <SuppliersTable suppliers={suppliers.data.results} />
              <Pagination
                page={filters.page}
                pageSize={SUPPLIERS_PAGE_SIZE}
                count={suppliers.data.count}
                hasPrevious={suppliers.data.previous !== null}
                hasNext={suppliers.data.next !== null}
                onPageChange={setPage}
              />
            </>
          ) : (
            <TableSkeleton label="Cargando proveedores" />
          )}
        </div>
      )}
    </div>
  );
}

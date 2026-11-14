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

import {
  TRAVEL_REQUESTS_PAGE_SIZE,
  useTravelRequestSummary,
  useTravelRequests,
} from '../api';
import { useRequestFilters } from '../use-request-filters';
import { RequestsFilters } from './requests-filters';
import { RequestsTable } from './requests-table';

function NewRequestLink({ clientId }: { clientId: number | null }) {
  return (
    <ButtonLink
      href={
        clientId
          ? `/solicitudes/nueva?client_id=${clientId}`
          : '/solicitudes/nueva'
      }
    >
      <Plus aria-hidden="true" />
      Nueva solicitud
    </ButtonLink>
  );
}

export function RequestsScreen() {
  const canManage = useHasPermission('travel_requests.manage');
  const filters = useRequestFilters();
  const { q, status, page, scope, setPage, clearFilters } = filters;
  const requests = useTravelRequests({
    q,
    status,
    ...scope,
    sort: 'recent',
    page,
  });
  const summary = useTravelRequestSummary(scope);
  const errorStatus = isApiError(requests.error)
    ? requests.error.status
    : undefined;
  // La página pedida ya no existe (por ejemplo, un enlace viejo): se vuelve a la primera en
  // vez de mostrar un error.
  const pageOutOfRange = errorStatus === 404 && page > 1;

  useEffect(() => {
    if (pageOutOfRange) setPage(1);
  }, [pageOutOfRange, setPage]);

  if (errorStatus === 403) return <ForbiddenState />;

  const hasFilters =
    q !== '' || status !== null || filters.mine || scope.clientId !== null;
  const isEmpty = requests.data && requests.data.results.length === 0;
  const newRequest = canManage && <NewRequestLink clientId={scope.clientId} />;

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Operación / 04"
        title="Solicitudes"
        description="Lo que piden los clientes para su viaje, desde que llega hasta que se cierra."
        actions={newRequest}
      />
      <RequestsFilters filters={filters} summary={summary.data} />
      {requests.isError && !pageOutOfRange ? (
        <ErrorState
          title="No pudimos cargar las solicitudes"
          action={
            <Button onClick={() => void requests.refetch()}>
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
          title="No hay solicitudes que coincidan con la búsqueda"
          action={
            <Button variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          }
        >
          Prueba con otro código, cliente o destino, o quita los filtros.
        </EmptyState>
      ) : isEmpty ? (
        <EmptyState
          title="Aún no hay solicitudes registradas"
          action={newRequest}
        >
          Cuando registres la primera solicitud de un cliente, aparecerá aquí.
        </EmptyState>
      ) : (
        <div
          aria-busy={requests.isFetching}
          className="overflow-hidden rounded-md border bg-card aria-busy:opacity-70"
        >
          {requests.data ? (
            <>
              <RequestsTable requests={requests.data.results} />
              <Pagination
                page={page}
                pageSize={TRAVEL_REQUESTS_PAGE_SIZE}
                count={requests.data.count}
                hasPrevious={requests.data.previous !== null}
                hasNext={requests.data.next !== null}
                onPageChange={setPage}
              />
            </>
          ) : (
            <TableSkeleton label="Cargando solicitudes" />
          )}
        </div>
      )}
    </div>
  );
}

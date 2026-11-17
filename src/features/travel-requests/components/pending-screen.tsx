'use client';

import { RotateCcw } from 'lucide-react';
import { useEffect } from 'react';

import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { ForbiddenState } from '@/components/forbidden-state';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { TableSkeleton } from '@/components/table-skeleton';
import { Button } from '@/components/ui/button';
import { ClientFilterTag } from '@/features/clients/components/client-filter-tag';
import { isApiError } from '@/lib/api/errors';

import {
  TRAVEL_REQUESTS_PAGE_SIZE,
  useTravelRequestSummary,
  useTravelRequests,
} from '../api';
import { useRequestFilters } from '../use-request-filters';
import { MineSwitch } from './mine-switch';
import { PendingSummary } from './pending-summary';
import { PendingTable } from './pending-table';

// Pendientes de cotización: nuevas o con el borrador empezado, de la que más espera a la más
// reciente. La búsqueda y el estado de la lista no aplican aquí; sí el asesor y el cliente.
export function PendingScreen() {
  const { mine, page, scope, setFilter, setPage, clearFilters } =
    useRequestFilters();
  const requests = useTravelRequests({
    q: '',
    status: 'pending',
    ...scope,
    sort: 'oldest',
    page,
  });
  const summary = useTravelRequestSummary(scope);
  const errorStatus = isApiError(requests.error)
    ? requests.error.status
    : undefined;
  const pageOutOfRange = errorStatus === 404 && page > 1;

  useEffect(() => {
    if (pageOutOfRange) setPage(1);
  }, [pageOutOfRange, setPage]);

  if (errorStatus === 403) return <ForbiddenState />;

  const hasFilters = mine || scope.clientId !== null;
  const isEmpty = requests.data && requests.data.results.length === 0;

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Operación / 05"
        title="Por cotizar"
        description="Solicitudes que todavía esperan una propuesta, empezando por la que más lleva esperando."
      />
      <PendingSummary summary={summary.data} />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <MineSwitch
          checked={mine}
          onChange={(value) => setFilter({ mine: value })}
        />
        {scope.clientId !== null && (
          <ClientFilterTag
            clientId={scope.clientId}
            onRemove={() => setFilter({ client_id: null })}
          />
        )}
      </div>
      {requests.isError && !pageOutOfRange ? (
        <ErrorState
          title="No pudimos cargar las solicitudes por cotizar"
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
          title="No hay solicitudes pendientes que coincidan."
          action={
            <Button variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          }
        >
          Quita &ldquo;Mis solicitudes&rdquo; o el filtro por cliente para ver
          todas las pendientes.
        </EmptyState>
      ) : isEmpty ? (
        <EmptyState title="No hay solicitudes por cotizar.">
          Todas las solicitudes abiertas ya tienen su cotización.
        </EmptyState>
      ) : (
        <div
          aria-busy={requests.isFetching}
          className="overflow-hidden rounded-md border bg-card aria-busy:opacity-70"
        >
          {requests.data ? (
            <>
              <PendingTable requests={requests.data.results} />
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
            <TableSkeleton label="Cargando solicitudes por cotizar" />
          )}
        </div>
      )}
    </div>
  );
}

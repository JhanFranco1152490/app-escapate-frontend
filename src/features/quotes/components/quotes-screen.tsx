'use client';

import { RotateCcw } from 'lucide-react';
import { useEffect } from 'react';

import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { FilterTabs } from '@/components/filter-tabs';
import { ForbiddenState } from '@/components/forbidden-state';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { SearchInput } from '@/components/search-input';
import { TableSkeleton } from '@/components/table-skeleton';
import { Button } from '@/components/ui/button';
import { isApiError } from '@/lib/api/errors';

import { QUOTES_PAGE_SIZE, useQuotes, type QuoteStatusFilter } from '../api';
import { useQuoteFilters } from '../use-quote-filters';
import { QuotesTable } from './quotes-table';

const TABS: { label: string; value: QuoteStatusFilter | null }[] = [
  { label: 'Todas', value: null },
  { label: 'Borradores', value: 'draft' },
  { label: 'Enviadas', value: 'sent' },
  { label: 'Vencidas', value: 'expired' },
  { label: 'Aceptadas', value: 'accepted' },
  { label: 'Rechazadas', value: 'rejected' },
];

export function QuotesScreen() {
  const filters = useQuoteFilters();
  const { q, status, page, setPage } = filters;
  const quotes = useQuotes({
    q,
    status,
    clientId: null,
    travelRequestId: null,
    page,
  });
  const errorStatus = isApiError(quotes.error)
    ? quotes.error.status
    : undefined;
  const pageOutOfRange = errorStatus === 404 && page > 1;

  useEffect(() => {
    if (pageOutOfRange) setPage(1);
  }, [pageOutOfRange, setPage]);

  if (errorStatus === 403) return <ForbiddenState />;

  const hasFilters = q !== '' || status !== null;
  const isEmpty = quotes.data && quotes.data.results.length === 0;

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Operación / 06"
        title="Cotizaciones"
        description="Las propuestas que se arman para cada solicitud. Se crean desde la ficha de la solicitud."
      />
      <div className="flex flex-col gap-4">
        <div className="overflow-x-auto">
          <FilterTabs
            label="Estado de la cotización"
            tabs={TABS}
            value={status}
            onChange={filters.setStatus}
          />
        </div>
        <SearchInput
          label="Buscar cotización"
          placeholder="Código, cliente o destino"
          maxLength={100}
          value={filters.search}
          onValueChange={filters.setSearch}
        />
      </div>
      {quotes.isError && !pageOutOfRange ? (
        <ErrorState
          title="No pudimos cargar las cotizaciones"
          action={
            <Button onClick={() => void quotes.refetch()}>
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
          title="No hay cotizaciones que coincidan con la búsqueda"
          action={
            <Button variant="outline" onClick={filters.clearFilters}>
              Limpiar filtros
            </Button>
          }
        >
          Prueba con otro código, cliente o destino, o quita los filtros.
        </EmptyState>
      ) : isEmpty ? (
        <EmptyState title="Aún no hay cotizaciones">
          Abre una solicitud y usa «Crear cotización» para armar la primera.
        </EmptyState>
      ) : (
        <div
          aria-busy={quotes.isFetching}
          className="overflow-hidden rounded-md border bg-card aria-busy:opacity-70"
        >
          {quotes.data ? (
            <>
              <QuotesTable quotes={quotes.data.results} />
              <Pagination
                page={page}
                pageSize={QUOTES_PAGE_SIZE}
                count={quotes.data.count}
                hasPrevious={quotes.data.previous !== null}
                hasNext={quotes.data.next !== null}
                onPageChange={setPage}
              />
            </>
          ) : (
            <TableSkeleton label="Cargando cotizaciones" />
          )}
        </div>
      )}
    </div>
  );
}

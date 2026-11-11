'use client';

import { useState } from 'react';

import { Pagination } from '@/components/pagination';
import { Skeleton } from '@/components/ui/skeleton';

import type { TouristServiceDetail } from '../api';
import { RATES_PAGE_SIZE, useServiceRates } from '../rate-api';
import { ServiceRatesTable } from './service-rates-table';

const muted = 'px-5 py-4 text-sm text-muted-foreground';

const registered = (count: number) =>
  count === 1 ? '1 registrada' : `${count} registradas`;

export function ServiceRatesSection({
  service,
}: {
  service: Pick<TouristServiceDetail, 'id'>;
}) {
  const [page, setPage] = useState(1);
  const rates = useServiceRates(service.id, page);
  const data = rates.data;

  return (
    <section
      aria-labelledby="service-rates-title"
      className="rounded-md border bg-card"
    >
      <header className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-3">
          <h2
            id="service-rates-title"
            className="font-heading text-lg font-semibold"
          >
            Tarifas del servicio
          </h2>
          {data && (
            <span className="font-mono text-[0.6875rem] text-muted-foreground">
              {registered(data.count)}
            </span>
          )}
        </div>
      </header>
      {rates.isError ? (
        <p className={muted}>
          No pudimos cargar sus tarifas.{' '}
          <button
            type="button"
            onClick={() => void rates.refetch()}
            className="underline underline-offset-4"
          >
            Reintentar
          </button>
        </p>
      ) : !data ? (
        <div
          role="status"
          aria-label="Cargando sus tarifas"
          className="px-5 py-4"
        >
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
      ) : data.results.length === 0 ? (
        <p className={muted}>Este servicio aún no tiene tarifas.</p>
      ) : (
        <ServiceRatesTable rates={data.results} />
      )}
      {data && data.count > RATES_PAGE_SIZE && (
        <Pagination
          page={page}
          pageSize={RATES_PAGE_SIZE}
          count={data.count}
          hasPrevious={data.previous !== null}
          hasNext={data.next !== null}
          onPageChange={setPage}
        />
      )}
    </section>
  );
}

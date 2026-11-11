'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Alert } from '@/components/alert';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useHasPermission } from '@/features/auth/permissions';
import type { ActionFeedback } from '@/lib/action-feedback';

import type { TouristServiceDetail } from '../api';
import {
  RATES_PAGE_SIZE,
  useServiceRates,
  type ServiceRate,
} from '../rate-api';
import { RateRowActions } from './rate-row-actions';
import { RatePanel, type RatePanelState } from './rate-panel';
import { ServiceRatesTable } from './service-rates-table';

const muted = 'px-5 py-4 text-sm text-muted-foreground';

const registered = (count: number) =>
  count === 1 ? '1 registrada' : `${count} registradas`;

export function ServiceRatesSection({
  service,
}: {
  service: Pick<TouristServiceDetail, 'id' | 'service_type' | 'is_active'>;
}) {
  const canManage = useHasPermission('tourist_services.manage');
  const [page, setPage] = useState(1);
  const [panel, setPanel] = useState<RatePanelState>();
  const [feedback, setFeedback] = useState<ActionFeedback>();
  const rates = useServiceRates(service.id, page);
  const data = rates.data;

  const open = (next: RatePanelState) => {
    setFeedback(undefined);
    setPanel(next);
  };
  const saved = (text: string) => {
    setPanel(undefined);
    setFeedback({ variant: 'info', text });
  };
  const deleted = (rateId: number) => (result: ActionFeedback) => {
    // La tarifa que se estaba editando ya no existe (o cambió): el panel se cierra.
    if (panel?.mode === 'edit' && panel.rate.id === rateId) setPanel(undefined);
    setFeedback(result);
  };
  const reloadRate = (rateId: number) => async () => {
    const result = await rates.refetch();
    return { data: result.data?.results.find((rate) => rate.id === rateId) };
  };

  const actions =
    canManage &&
    ((rate: ServiceRate) => (
      <RateRowActions
        serviceId={service.id}
        rate={rate}
        onEdit={(picked) => open({ mode: 'edit', rate: picked })}
        onDeleted={deleted(rate.id)}
      />
    ));

  const list = rates.isError ? (
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
    <div role="status" aria-label="Cargando sus tarifas" className="px-5 py-4">
      <Skeleton className="h-4 w-64 max-w-full" />
    </div>
  ) : data.results.length === 0 ? (
    <p className={muted}>Este servicio aún no tiene tarifas.</p>
  ) : (
    <ServiceRatesTable rates={data.results} actions={actions || undefined} />
  );

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
        {canManage && service.is_active && panel?.mode !== 'create' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => open({ mode: 'create' })}
          >
            <Plus aria-hidden="true" />
            Agregar tarifa
          </Button>
        )}
      </header>
      {canManage && !service.is_active && (
        <p className={`${muted} border-b`}>
          Activa el servicio para agregarle tarifas.
        </p>
      )}
      {feedback && (
        <div className="border-b px-5 py-3">
          <Alert variant={feedback.variant} title={feedback.text} />
        </div>
      )}
      {/* El panel de la tarifa va junto a la tabla en escritorio y debajo en celular: así se
          ven las demás temporadas mientras se carga una. */}
      <div
        className={
          panel ? 'grid lg:grid-cols-[minmax(0,1fr)_400px]' : undefined
        }
      >
        <div className="min-w-0">
          {list}
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
        </div>
        {panel && (
          <RatePanel
            state={panel}
            serviceId={service.id}
            serviceType={service.service_type}
            reloadRate={reloadRate}
            onSaved={saved}
            onClose={() => setPanel(undefined)}
          />
        )}
      </div>
    </section>
  );
}

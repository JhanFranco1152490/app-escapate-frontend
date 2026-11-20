'use client';

import { parseAsInteger, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { useState } from 'react';

import { Alert } from '@/components/alert';
import { EmptyState } from '@/components/empty-state';
import { FilterTabs } from '@/components/filter-tabs';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { TableSkeleton } from '@/components/table-skeleton';

import {
  FOLLOW_UPS_PAGE_SIZE,
  useAlertSummary,
  useFollowUps,
  type FollowUpFilters,
} from '../follow-up-api';
import { FollowUpsList } from './follow-ups-list';

const VIEWS = ['red', 'yellow', 'green', 'done'] as const;
type View = (typeof VIEWS)[number];

const parsers = {
  view: parseAsStringLiteral(VIEWS).withDefault('red'),
  page: parseAsInteger.withDefault(1),
};

const filtersFor = (view: View, page: number): FollowUpFilters =>
  view === 'done'
    ? { status: 'done', alert: null, quoteId: null, page }
    : { status: 'pending', alert: view, quoteId: null, page };

// Todos los seguimientos de la agencia, por color del semáforo: lo vencido primero.
export function FollowUpsScreen() {
  const [{ view, page }, setValues] = useQueryStates(parsers, {
    history: 'replace',
  });
  const [feedback, setFeedback] = useState<string>();
  const followUps = useFollowUps(filtersFor(view, Math.max(page, 1)));
  const summary = useAlertSummary();
  const count = (color: 'red' | 'yellow' | 'green') =>
    summary.data ? ` · ${summary.data[color]}` : '';

  const tabs: { label: string; value: View }[] = [
    { label: `Vencidos${count('red')}`, value: 'red' },
    { label: `Hoy y mañana${count('yellow')}`, value: 'yellow' },
    { label: `Próximos${count('green')}`, value: 'green' },
    { label: 'Registrados', value: 'done' },
  ];

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Operación / 07"
        title="Seguimientos"
        description="Los contactos programados con los clientes sobre sus cotizaciones, con su semáforo."
      />
      <div className="overflow-x-auto">
        <FilterTabs
          label="Semáforo"
          tabs={tabs}
          value={view}
          onChange={(value) => void setValues({ view: value, page: null })}
        />
      </div>
      {feedback && <Alert variant="info" title={feedback} />}
      {followUps.data?.results.length === 0 ? (
        <EmptyState title="Nada por aquí">
          No hay seguimientos en esta pestaña.
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-md border bg-card">
          {followUps.data ? (
            <>
              <FollowUpsList
                followUps={followUps.data.results}
                showQuote
                onDone={setFeedback}
              />
              <Pagination
                page={page}
                pageSize={FOLLOW_UPS_PAGE_SIZE}
                count={followUps.data.count}
                hasPrevious={followUps.data.previous !== null}
                hasNext={followUps.data.next !== null}
                onPageChange={(next) =>
                  void setValues({ page: next > 1 ? next : null })
                }
              />
            </>
          ) : (
            <TableSkeleton label="Cargando seguimientos" />
          )}
        </div>
      )}
    </div>
  );
}

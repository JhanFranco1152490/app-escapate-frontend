'use client';

import { SearchInput } from '@/components/search-input';
import { ClientFilterTag } from '@/features/clients/components/client-filter-tag';

import type { TravelRequestSummary } from '../api';
import type { useRequestFilters } from '../use-request-filters';
import { MineSwitch } from './mine-switch';
import { StatusTabs } from './status-tabs';

type RequestsFiltersProps = {
  filters: ReturnType<typeof useRequestFilters>;
  summary: TravelRequestSummary | undefined;
};

export function RequestsFilters({ filters, summary }: RequestsFiltersProps) {
  const { search, status, mine, scope, setFilter } = filters;
  return (
    <div className="flex flex-col gap-4">
      <StatusTabs
        value={status}
        summary={summary}
        onChange={(value) => setFilter({ status: value })}
      />
      <SearchInput
        label="Buscar solicitud"
        placeholder="Código, cliente o destino"
        maxLength={100}
        value={search}
        onValueChange={(q) => setFilter({ q })}
      />
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
    </div>
  );
}

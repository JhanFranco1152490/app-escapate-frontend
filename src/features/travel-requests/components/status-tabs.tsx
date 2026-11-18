import { FilterTabs } from '@/components/filter-tabs';

import type { TravelRequestStatus, TravelRequestSummary } from '../api';

const TABS: { label: string; value: TravelRequestStatus | null }[] = [
  { label: 'Todas', value: null },
  { label: 'Nuevas', value: 'new' },
  { label: 'En cotización', value: 'quoting' },
  { label: 'Cotizadas', value: 'quoted' },
  { label: 'Cerradas', value: 'closed' },
];

type StatusTabsProps = {
  value: TravelRequestStatus | null;
  // Mientras los conteos cargan, las pestañas salen sin número.
  summary: TravelRequestSummary | undefined;
  onChange: (value: TravelRequestStatus | null) => void;
};

export function StatusTabs({ value, summary, onChange }: StatusTabsProps) {
  const countOf = (status: TravelRequestStatus | null) =>
    status === null ? summary?.total : summary?.by_status[status];
  const tabs = TABS.map((tab) => {
    const count = countOf(tab.value);
    return {
      ...tab,
      label: count === undefined ? tab.label : `${tab.label} · ${count}`,
    };
  });

  return (
    <div className="overflow-x-auto">
      <FilterTabs
        label="Estado de la solicitud"
        tabs={tabs}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

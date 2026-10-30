'use client';

import { FilterTabs } from '@/components/filter-tabs';
import { SearchInput } from '@/components/search-input';

import type { ClientType } from '../api';

const TABS: { label: string; value: ClientType | null }[] = [
  { label: 'Todos', value: null },
  { label: 'Personas', value: 'person' },
  { label: 'Empresas', value: 'company' },
];

type ClientsFiltersProps = {
  search: string;
  clientType: ClientType | null;
  onChange: (patch: { q?: string; client_type?: ClientType | null }) => void;
};

export function ClientsFilters({
  search,
  clientType,
  onChange,
}: ClientsFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <FilterTabs
        label="Tipo de cliente"
        tabs={TABS}
        value={clientType}
        onChange={(value) => onChange({ client_type: value })}
      />
      <SearchInput
        label="Buscar cliente"
        placeholder="Nombre, documento, correo o teléfono"
        maxLength={100}
        value={search}
        onValueChange={(q) => onChange({ q })}
      />
    </div>
  );
}

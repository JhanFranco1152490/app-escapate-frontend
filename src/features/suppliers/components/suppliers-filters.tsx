'use client';

import { FilterTabs } from '@/components/filter-tabs';
import { SearchInput } from '@/components/search-input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';

import type { SupplierCategory, SupplierStatusFilter } from '../api';
import { SUPPLIER_CATEGORIES, SUPPLIER_CATEGORY_LABELS } from '../categories';

// Sin conteos: con varias categorías por proveedor, la suma no daría el total.
const TABS: { label: string; value: SupplierCategory | null }[] = [
  { label: 'Todos', value: null },
  ...SUPPLIER_CATEGORIES.map((category) => ({
    label: SUPPLIER_CATEGORY_LABELS[category],
    value: category,
  })),
];

const STATUS_OPTIONS: { label: string; value: SupplierStatusFilter }[] = [
  { label: 'Activos', value: 'active' },
  { label: 'Inactivos', value: 'inactive' },
  { label: 'Todos', value: 'all' },
];

type SuppliersFiltersProps = {
  search: string;
  category: SupplierCategory | null;
  status: SupplierStatusFilter;
  onChange: (patch: {
    q?: string;
    category?: SupplierCategory | null;
    status?: SupplierStatusFilter;
  }) => void;
};

export function SuppliersFilters({
  search,
  category,
  status,
  onChange,
}: SuppliersFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <FilterTabs
          label="Clasificación"
          tabs={TABS}
          value={category}
          onChange={(value) => onChange({ category: value })}
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="min-w-0 flex-1">
          <SearchInput
            label="Buscar proveedor"
            placeholder="Nombre, documento, contacto o correo"
            maxLength={100}
            value={search}
            onValueChange={(q) => onChange({ q })}
          />
        </div>
        <NativeSelect
          aria-label="Estado"
          className="w-full sm:w-44 [&_select]:h-11"
          value={status}
          onChange={(event) =>
            onChange({ status: event.target.value as SupplierStatusFilter })
          }
        >
          {STATUS_OPTIONS.map((option) => (
            <NativeSelectOption key={option.value} value={option.value}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}

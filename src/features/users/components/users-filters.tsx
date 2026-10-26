'use client';

import { FilterTabs } from '@/components/filter-tabs';
import { SearchInput } from '@/components/search-input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { useRoles } from '@/features/roles/api';

import type { UserStatusFilter } from '../api';

const TABS: { label: string; value: UserStatusFilter | null }[] = [
  { label: 'Todos', value: null },
  { label: 'Activos', value: 'active' },
  { label: 'Inactivos', value: 'inactive' },
];

type UsersFiltersProps = {
  search: string;
  status: UserStatusFilter | null;
  roleId: number | null;
  onChange: (patch: {
    q?: string;
    status?: UserStatusFilter | null;
    role_id?: number | null;
  }) => void;
};

export function UsersFilters({
  search,
  status,
  roleId,
  onChange,
}: UsersFiltersProps) {
  const roles = useRoles();

  return (
    <div className="flex flex-col gap-4">
      <FilterTabs
        label="Estado"
        tabs={TABS}
        value={status}
        onChange={(value) => onChange({ status: value })}
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput
          label="Buscar usuario"
          placeholder="Buscar por nombre o documento"
          maxLength={100}
          value={search}
          onValueChange={(q) => onChange({ q })}
        />
        <NativeSelect
          aria-label="Rol"
          className="w-full sm:w-60 [&_select]:h-11"
          value={roleId?.toString() ?? ''}
          onChange={(event) =>
            onChange({
              role_id: event.target.value ? Number(event.target.value) : null,
            })
          }
        >
          <NativeSelectOption value="">Todos los roles</NativeSelectOption>
          {roles.data?.map((role) => (
            <NativeSelectOption key={role.id} value={role.id}>
              {role.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}

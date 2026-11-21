'use client';

import { parseAsString, useQueryStates } from 'nuqs';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { todayInBogota } from '@/lib/format/dates';

import type { Period } from '../api';

// El período en la URL; por defecto, lo que va del año.
export function usePeriod() {
  const today = todayInBogota();
  return useQueryStates(
    {
      from: parseAsString.withDefault(`${today.slice(0, 4)}-01-01`),
      to: parseAsString.withDefault(today),
    },
    { history: 'replace' },
  );
}

export function PeriodFields({
  period,
  onChange,
}: {
  period: Period;
  onChange: (patch: Partial<Period>) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="period-from">Desde</Label>
        <Input
          id="period-from"
          type="date"
          className="h-11"
          value={period.from}
          onChange={(event) => onChange({ from: event.target.value })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="period-to">Hasta</Label>
        <Input
          id="period-to"
          type="date"
          className="h-11"
          value={period.to}
          onChange={(event) => onChange({ to: event.target.value })}
        />
      </div>
    </div>
  );
}

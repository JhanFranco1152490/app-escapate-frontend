import { cn } from 'cn';

import type { RoleListItem } from '@/features/roles/api';

type RoleOptionProps = {
  role: RoleListItem;
  current: boolean;
  checked: boolean;
  onSelect: () => void;
};

export function RoleOption({
  role,
  current,
  checked,
  onSelect,
}: RoleOptionProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer gap-3.5 border-t px-5 py-4 first:border-t-0',
        checked && 'bg-orange-500/8',
      )}
    >
      <input
        type="radio"
        name="role"
        className="mt-1 size-4 accent-orange-500"
        checked={checked}
        onChange={onSelect}
      />
      <span className="flex min-w-0 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2 font-semibold">
          {role.name}
          {current && (
            <span className="rounded-full border px-2 font-mono text-[0.5625rem] font-normal tracking-[0.12em] text-muted-foreground uppercase">
              Actual
            </span>
          )}
        </span>
        {role.description && (
          <span className="text-[0.78125rem] leading-snug text-muted-foreground">
            {role.description}
          </span>
        )}
      </span>
    </label>
  );
}

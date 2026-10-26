import { cn } from 'cn';

type FilterTab<T> = { label: string; value: T };

type FilterTabsProps<T> = {
  label: string;
  tabs: FilterTab<T>[];
  value: T;
  onChange: (value: T) => void;
};

// Botones que filtran la misma tabla, no pestañas que cambian de panel: por eso son botones
// con `aria-pressed` y no un `tablist`.
export function FilterTabs<T>({
  label,
  tabs,
  value,
  onChange,
}: FilterTabsProps<T>) {
  return (
    <div className="flex gap-6 border-b" role="group" aria-label={label}>
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.label}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(tab.value)}
            className={cn(
              '-mb-px min-h-11 border-b-2 font-mono text-[0.6875rem] tracking-[0.16em] uppercase transition-colors',
              selected
                ? 'border-orange-500 text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

import { cn } from 'cn';

type SegmentedChoiceProps<T extends string> = {
  legend: string;
  name: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
};

// Una opción entre pocas que cambia qué campos pide el formulario (tipo de cliente, modo de
// fechas). Son radios (una sola opción, navegable con las flechas) con la apariencia de un
// selector segmentado.
export function SegmentedChoice<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  disabled = false,
}: SegmentedChoiceProps<T>) {
  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className="flex w-full rounded-lg border p-1 sm:w-fit">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex min-h-10 flex-1 cursor-pointer items-center justify-center rounded-md px-5 text-sm transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-disabled:cursor-not-allowed sm:flex-none',
              value === option.value
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

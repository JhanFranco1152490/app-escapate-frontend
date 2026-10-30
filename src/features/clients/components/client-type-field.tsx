import { cn } from 'cn';

import type { ClientType } from '../api';
import { CLIENT_TYPE_LABELS } from '../labels';

const TYPES = Object.keys(CLIENT_TYPE_LABELS) as ClientType[];

type ClientTypeFieldProps = {
  value: ClientType;
  onChange: (value: ClientType) => void;
  // En la edición el tipo se muestra pero no se puede cambiar.
  disabled?: boolean;
};

// Primera decisión del formulario: cambia qué campos se piden. Son radios (una sola opción,
// navegable con las flechas) con la apariencia de un selector segmentado.
export function ClientTypeField({
  value,
  onChange,
  disabled = false,
}: ClientTypeFieldProps) {
  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="mb-2 text-sm font-medium">Tipo de cliente</legend>
      <div className="flex w-full rounded-lg border p-1 sm:w-fit">
        {TYPES.map((type) => (
          <label
            key={type}
            className={cn(
              'flex min-h-10 flex-1 cursor-pointer items-center justify-center rounded-md px-5 text-sm transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-disabled:cursor-not-allowed sm:flex-none',
              value === type
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <input
              type="radio"
              name="client_type"
              value={type}
              checked={value === type}
              onChange={() => onChange(type)}
              className="sr-only"
            />
            {CLIENT_TYPE_LABELS[type]}
          </label>
        ))}
      </div>
      {disabled && (
        <p className="text-[0.78125rem] text-muted-foreground">
          El tipo de cliente no se puede cambiar. Si se registró mal, registra
          el cliente de nuevo.
        </p>
      )}
    </fieldset>
  );
}

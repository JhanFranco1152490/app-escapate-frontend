import { cn } from 'cn';
import { CircleAlert } from 'lucide-react';

import { fieldAriaProps, fieldErrorId } from '@/components/form-field';
import { SUPPLIER_CATEGORY_LABELS } from '@/features/suppliers/categories';

import type { ServiceType } from '../api';

type ServiceTypeFieldProps = {
  // Las clasificaciones del proveedor: un servicio solo puede ser de una de ellas.
  types: readonly ServiceType[];
  value: string;
  onChange: (value: ServiceType) => void;
  error?: string;
  // En la edición el tipo se muestra pero no se puede cambiar.
  disabled?: boolean;
};

// Primera decisión del formulario: cambia qué características se piden. Son radios (una sola
// opción, navegable con las flechas) con forma de tarjeta.
export function ServiceTypeField({
  types,
  value,
  onChange,
  error,
  disabled = false,
}: ServiceTypeFieldProps) {
  return (
    <fieldset
      className="flex min-w-0 flex-col gap-2 md:col-span-2"
      disabled={disabled}
      {...fieldAriaProps('service_type', { error })}
    >
      <legend className="mb-2 text-sm font-medium">
        Tipo de servicio
        <span aria-hidden="true" className="ml-1 text-destructive">
          *
        </span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {types.map((type) => (
          <label
            key={type}
            className={cn(
              'flex min-h-11 cursor-pointer items-center rounded-lg border px-4 text-sm transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-disabled:cursor-not-allowed',
              value === type
                ? 'border-foreground bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <input
              type="radio"
              name="service_type"
              value={type}
              checked={value === type}
              onChange={() => onChange(type)}
              className="sr-only"
            />
            {SUPPLIER_CATEGORY_LABELS[type]}
          </label>
        ))}
      </div>
      {disabled && (
        <p className="text-[0.78125rem] text-muted-foreground">
          El tipo de un servicio no se puede cambiar. Si se registró mal,
          desactívalo y registra otro.
        </p>
      )}
      {error && (
        <p
          id={fieldErrorId('service_type')}
          className="flex items-center gap-1.5 text-[0.78125rem] text-destructive"
        >
          <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </fieldset>
  );
}

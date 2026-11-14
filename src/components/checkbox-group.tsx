import { cn } from 'cn';
import { CircleAlert } from 'lucide-react';
import type { UseFormRegisterReturn } from 'react-hook-form';

import { fieldAriaProps, fieldErrorId } from '@/components/form-field';

type CheckboxGroupProps = {
  id: string;
  legend: string;
  options: { value: string; label: string }[];
  // Todas las casillas se registran con el mismo nombre: el formulario recibe la lista de las
  // marcadas.
  registration: UseFormRegisterReturn;
  required?: boolean;
  error?: string;
  className?: string;
};

// Varias opciones de una lista fija (lo que incluye un servicio, los tipos de un viaje).
export function CheckboxGroup({
  id,
  legend,
  options,
  registration,
  required,
  error,
  className,
}: CheckboxGroupProps) {
  return (
    <fieldset
      className={cn('flex min-w-0 flex-col gap-2', className)}
      {...fieldAriaProps(id, { error })}
    >
      <legend className="mb-2 text-sm font-medium">
        {legend}
        {required && (
          <span aria-hidden="true" className="ml-1 text-destructive">
            *
          </span>
        )}
      </legend>
      <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
        {options.map(({ value, label }) => (
          <label
            key={value}
            className="flex min-h-11 items-center gap-3 text-[0.875rem]"
          >
            <input
              type="checkbox"
              value={value}
              className="size-4 shrink-0 accent-orange-500"
              {...registration}
            />
            {label}
          </label>
        ))}
      </div>
      {error && (
        <p
          id={fieldErrorId(id)}
          className="flex items-center gap-1.5 text-[0.78125rem] text-destructive"
        >
          <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </fieldset>
  );
}

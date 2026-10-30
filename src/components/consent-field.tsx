import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

import { fieldAriaProps, fieldErrorId } from './form-field';

type ConsentFieldProps = {
  field: UseFormRegisterReturn;
  error?: string;
  children: ReactNode;
};

// Casilla de autorización de tratamiento de datos: el texto es la declaración que hace quien
// registra, así que es la etiqueta completa de la casilla.
export function ConsentField({ field, error, children }: ConsentFieldProps) {
  const id = field.name;
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="flex min-h-11 items-start gap-3 text-[0.875rem] leading-relaxed"
      >
        <input
          id={id}
          type="checkbox"
          className="mt-1 size-4 shrink-0 accent-orange-500"
          {...field}
          {...fieldAriaProps(id, { error })}
        />
        <span>
          {children}
          <span aria-hidden="true" className="ml-1 text-destructive">
            *
          </span>
        </span>
      </label>
      {error && (
        <p
          id={fieldErrorId(id)}
          className="flex items-center gap-1.5 text-[0.78125rem] text-destructive"
        >
          <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

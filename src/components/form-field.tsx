import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

import { Label } from '@/components/ui/label';

// El control recibe aria-invalid y aria-describedby={fieldErrorId(id)} para que el lector de
// pantalla lea el mensaje de error al enfocarlo.
export const fieldErrorId = (id: string) => `${id}-error`;

export const invalidFieldProps = (id: string, error: string | undefined) =>
  error ? { 'aria-invalid': true, 'aria-describedby': fieldErrorId(id) } : {};

type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
};

export function FormField({
  id,
  label,
  required,
  error,
  children,
}: FormFieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={id}>
        <span>
          {label}
          {required && (
            <span aria-hidden="true" className="ml-1 text-destructive">
              *
            </span>
          )}
        </span>
      </Label>
      {children}
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

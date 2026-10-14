import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

import { Label } from '@/components/ui/label';

export const fieldErrorId = (id: string) => `${id}-error`;
export const fieldHintId = (id: string) => `${id}-hint`;

// Atributos para el control: aria-describedby apunta a la ayuda y al error para que el lector
// de pantalla los lea al enfocarlo, y aria-invalid lo marca cuando hay error.
export function fieldAriaProps(
  id: string,
  { error, hint }: { error?: string; hint?: string },
) {
  const describedBy = [hint && fieldHintId(id), error && fieldErrorId(id)]
    .filter(Boolean)
    .join(' ');
  return {
    ...(error && { 'aria-invalid': true }),
    ...(describedBy && { 'aria-describedby': describedBy }),
  };
}

type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
};

export function FormField({
  id,
  label,
  required,
  error,
  hint,
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
      {hint && (
        <p
          id={fieldHintId(id)}
          className="text-[0.78125rem] leading-normal text-muted-foreground"
        >
          {hint}
        </p>
      )}
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

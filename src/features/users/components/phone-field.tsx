import type { UseFormRegisterReturn } from 'react-hook-form';

import { FormField, fieldAriaProps } from '@/components/form-field';
import { Input } from '@/components/ui/input';

type PhoneFieldProps = {
  field: UseFormRegisterReturn<'phone'>;
  error?: string;
};

// El indicativo se muestra fijo y no es parte del valor: la persona escribe los 10 dígitos.
// Si pega el número con +57, espacios o guiones, el formulario lo limpia antes de enviarlo.
export function PhoneField({ field, error }: PhoneFieldProps) {
  return (
    <FormField id="phone" label="Celular" required error={error}>
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center font-mono text-sm text-muted-foreground"
        >
          +57
        </span>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          placeholder="300 123 4567"
          className="h-11 pl-13"
          {...field}
          {...fieldAriaProps('phone', { error })}
        />
      </div>
    </FormField>
  );
}

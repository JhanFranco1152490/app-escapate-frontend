import { FormField, fieldAriaProps } from '@/components/form-field';
import { Input } from '@/components/ui/input';

import type { RequestFormApi } from '../schemas';

type CountInputProps = {
  form: RequestFormApi;
  name: 'adults' | 'minors';
  label: string;
};

// Una cantidad de personas: teclado numérico en el celular, sin las flechas de un
// `type="number"`, que cambian el valor con la rueda del ratón.
export function CountInput({
  form: {
    register,
    formState: { errors },
  },
  name,
  label,
}: CountInputProps) {
  const error = errors[name]?.message;
  return (
    <FormField id={name} label={label} required error={error}>
      <Input
        id={name}
        inputMode="numeric"
        autoComplete="off"
        maxLength={2}
        className="h-11"
        {...register(name)}
        {...fieldAriaProps(name, { error })}
      />
    </FormField>
  );
}

import { FormField, fieldAriaProps } from '@/components/form-field';
import { Input } from '@/components/ui/input';

import type { ServiceFormApi, TextField } from '../schemas';

type AttributeInputProps = {
  form: ServiceFormApi;
  name: TextField;
  label: string;
  required?: boolean;
  hint?: string;
  // Los enteros van en un campo de texto con teclado numérico: `type="number"` cambia el valor
  // con la rueda del ratón y acepta "1e3".
  kind?: 'text' | 'integer' | 'time';
  maxLength?: number;
  placeholder?: string;
};

// Un campo propio del tipo de servicio, de texto, número entero u hora.
export function AttributeInput({
  form: {
    register,
    formState: { errors },
  },
  name,
  label,
  required,
  hint,
  kind = 'text',
  maxLength,
  placeholder,
}: AttributeInputProps) {
  const id = `attributes.${name}` as const;
  const error = errors.attributes?.[name]?.message;

  return (
    <FormField
      id={id}
      label={label}
      required={required}
      hint={hint}
      error={error}
    >
      <Input
        id={id}
        type={kind === 'time' ? 'time' : 'text'}
        inputMode={kind === 'integer' ? 'numeric' : undefined}
        autoComplete="off"
        maxLength={kind === 'integer' ? 3 : maxLength}
        placeholder={placeholder}
        className="h-11"
        {...register(id)}
        {...fieldAriaProps(id, { error, hint })}
      />
    </FormField>
  );
}

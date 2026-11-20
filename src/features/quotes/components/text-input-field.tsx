import {
  get,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from 'react-hook-form';

import { FormField, fieldAriaProps } from '@/components/form-field';
import { Textarea } from '@/components/textarea';
import { Input } from '@/components/ui/input';

type TextInputFieldProps<T extends FieldValues> = {
  form: Pick<UseFormReturn<T>, 'register' | 'formState'>;
  name: Path<T>;
  label: string;
  required?: boolean;
  hint?: string;
  type?: 'text' | 'date';
  inputMode?: 'numeric' | 'decimal';
  multiline?: boolean;
  maxLength?: number;
};

// Un campo de texto, fecha o número escrito, con su etiqueta, ayuda y error.
export function TextInputField<T extends FieldValues>({
  form: {
    register,
    formState: { errors },
  },
  name,
  label,
  required,
  hint,
  type = 'text',
  inputMode,
  multiline,
  maxLength,
}: TextInputFieldProps<T>) {
  const id = `quote-${name}`;
  const error = get(errors, name)?.message as string | undefined;
  const aria = fieldAriaProps(id, { error, hint });
  return (
    <FormField
      id={id}
      label={label}
      required={required}
      hint={hint}
      error={error}
    >
      {multiline ? (
        <Textarea id={id} maxLength={maxLength} {...register(name)} {...aria} />
      ) : (
        <Input
          id={id}
          type={type}
          inputMode={inputMode}
          maxLength={maxLength}
          autoComplete="off"
          className="h-11"
          {...register(name)}
          {...aria}
        />
      )}
    </FormField>
  );
}

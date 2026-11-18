import { FormField, fieldAriaProps } from '@/components/form-field';
import { Input } from '@/components/ui/input';

import type { RequestFormApi } from '../schemas';

type DateField =
  'departure_date' | 'return_date' | 'window_start' | 'window_end';

type DateInputProps = {
  form: RequestFormApi;
  name: DateField;
  label: string;
  required?: boolean;
  hint?: string;
};

export function DateInput({
  form: {
    register,
    formState: { errors },
  },
  name,
  label,
  required,
  hint,
}: DateInputProps) {
  const error = errors[name]?.message;
  return (
    <FormField
      id={name}
      label={label}
      required={required}
      hint={hint}
      error={error}
    >
      <Input
        id={name}
        type="date"
        className="h-11"
        {...register(name)}
        {...fieldAriaProps(name, { error, hint })}
      />
    </FormField>
  );
}

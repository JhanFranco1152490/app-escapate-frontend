import { FormField, fieldAriaProps } from '@/components/form-field';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';

import type { ServiceFormApi, TextField } from '../schemas';
import { optionsOf } from '../service-options';

type AttributeSelectProps = {
  form: ServiceFormApi;
  name: TextField;
  label: string;
  labels: Record<string, string>;
  required?: boolean;
};

// Una opción de una lista fija del tipo de servicio. Si no es obligatoria, se puede dejar
// "Sin especificar" y no se envía.
export function AttributeSelect({
  form: {
    register,
    formState: { errors },
  },
  name,
  label,
  labels,
  required,
}: AttributeSelectProps) {
  const id = `attributes.${name}` as const;
  const error = errors.attributes?.[name]?.message;

  return (
    <FormField id={id} label={label} required={required} error={error}>
      <NativeSelect
        id={id}
        className="w-full"
        {...register(id)}
        {...fieldAriaProps(id, { error })}
      >
        <NativeSelectOption value="">
          {required ? 'Elige una opción' : 'Sin especificar'}
        </NativeSelectOption>
        {optionsOf(labels).map(({ value, label: optionLabel }) => (
          <NativeSelectOption key={value} value={value}>
            {optionLabel}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </FormField>
  );
}

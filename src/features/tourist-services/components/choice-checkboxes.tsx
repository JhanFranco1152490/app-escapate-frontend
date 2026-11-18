import { CheckboxGroup } from '@/components/checkbox-group';

import type { ServiceFormApi } from '../schemas';
import { optionsOf } from '../service-options';

type ChoiceCheckboxesProps = {
  form: ServiceFormApi;
  name: 'includes' | 'meals';
  legend: string;
  labels: Record<string, string>;
  required?: boolean;
};

// Lo que incluye el servicio o las comidas que ofrece.
export function ChoiceCheckboxes({
  form: {
    register,
    formState: { errors },
  },
  name,
  legend,
  labels,
  required,
}: ChoiceCheckboxesProps) {
  const id = `attributes.${name}` as const;

  return (
    <CheckboxGroup
      id={id}
      legend={legend}
      options={optionsOf(labels)}
      registration={register(id)}
      required={required}
      error={errors.attributes?.[name]?.message}
      className="md:col-span-2"
    />
  );
}

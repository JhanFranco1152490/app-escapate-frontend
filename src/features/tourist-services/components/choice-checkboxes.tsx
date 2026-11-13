import { CircleAlert } from 'lucide-react';

import { fieldAriaProps, fieldErrorId } from '@/components/form-field';

import type { ServiceFormApi } from '../schemas';
import { optionsOf } from '../service-options';

type ChoiceCheckboxesProps = {
  form: ServiceFormApi;
  name: 'includes' | 'meals';
  legend: string;
  labels: Record<string, string>;
  required?: boolean;
};

// Varias opciones de una lista fija: lo que incluye el servicio o las comidas que ofrece.
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
  const error = errors.attributes?.[name]?.message;

  return (
    <fieldset
      className="flex min-w-0 flex-col gap-2 md:col-span-2"
      {...fieldAriaProps(id, { error })}
    >
      <legend className="mb-2 text-sm font-medium">
        {legend}
        {required && (
          <span aria-hidden="true" className="ml-1 text-destructive">
            *
          </span>
        )}
      </legend>
      <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
        {optionsOf(labels).map(({ value, label }) => (
          <label
            key={value}
            className="flex min-h-11 items-center gap-3 text-[0.875rem]"
          >
            <input
              type="checkbox"
              value={value}
              className="size-4 shrink-0 accent-orange-500"
              {...register(id)}
            />
            {label}
          </label>
        ))}
      </div>
      {error && (
        <p
          id={fieldErrorId(id)}
          className="flex items-center gap-1.5 text-[0.78125rem] text-destructive"
        >
          <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </fieldset>
  );
}

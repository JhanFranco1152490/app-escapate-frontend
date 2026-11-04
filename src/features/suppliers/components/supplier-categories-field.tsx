import { CircleAlert } from 'lucide-react';

import { fieldAriaProps, fieldErrorId } from '@/components/form-field';

import { SUPPLIER_CATEGORIES, SUPPLIER_CATEGORY_LABELS } from '../categories';
import type { SupplierFormApi } from '../schemas';

// Una o varias casillas de una lista fija: un proveedor puede vender, por ejemplo,
// alojamiento y tours.
export function SupplierCategoriesField({
  form: {
    register,
    formState: { errors },
  },
}: {
  form: SupplierFormApi;
}) {
  const error = errors.categories?.message;

  return (
    <fieldset
      className="flex min-w-0 flex-col gap-2 md:col-span-2"
      {...fieldAriaProps('categories', { error })}
    >
      <legend className="mb-2 text-sm font-medium">
        Clasificación
        <span aria-hidden="true" className="ml-1 text-destructive">
          *
        </span>
      </legend>
      <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
        {SUPPLIER_CATEGORIES.map((category) => (
          <label
            key={category}
            className="flex min-h-11 items-center gap-3 text-[0.875rem]"
          >
            <input
              type="checkbox"
              value={category}
              className="size-4 shrink-0 accent-orange-500"
              {...register('categories')}
            />
            {SUPPLIER_CATEGORY_LABELS[category]}
          </label>
        ))}
      </div>
      {error && (
        <p
          id={fieldErrorId('categories')}
          className="flex items-center gap-1.5 text-[0.78125rem] text-destructive"
        >
          <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </fieldset>
  );
}

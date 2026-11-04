import { CITY_LIST_ID } from '@/components/city-datalist';
import { FormField, fieldAriaProps } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { DOCUMENT_TYPE_NAMES } from '@/lib/format/document';

import { SUPPLIER_DOCUMENT_TYPES } from '../categories';
import type { SupplierFormApi } from '../schemas';
import { SupplierCategoriesField } from './supplier-categories-field';

type TextName = 'trade_name' | 'legal_name' | 'city' | 'coverage_zone';

// Quién es el proveedor y qué vende. El documento es opcional: los hay del exterior y los
// hay personas naturales sin NIT.
export function SupplierIdentityFields({ form }: { form: SupplierFormApi }) {
  const {
    register,
    formState: { errors },
  } = form;
  const text = (
    name: TextName,
    label: string,
    maxLength: number,
    options: { required?: boolean; list?: string } = {},
  ) => (
    <FormField
      id={name}
      label={label}
      required={options.required}
      error={errors[name]?.message}
    >
      <Input
        id={name}
        autoComplete="off"
        maxLength={maxLength}
        className="h-11"
        list={options.list}
        {...register(name)}
        {...fieldAriaProps(name, { error: errors[name]?.message })}
      />
    </FormField>
  );

  return (
    <>
      {text('trade_name', 'Nombre comercial', 150, { required: true })}
      {text('legal_name', 'Razón social', 150)}
      <FormField id="document_type" label="Tipo de documento">
        <NativeSelect
          id="document_type"
          className="w-full [&_select]:h-11"
          {...register('document_type')}
        >
          <NativeSelectOption value="">Sin documento</NativeSelectOption>
          {SUPPLIER_DOCUMENT_TYPES.map((type) => (
            <NativeSelectOption key={type} value={type}>
              {DOCUMENT_TYPE_NAMES[type]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>
      <FormField
        id="document_number"
        label="Número de documento"
        error={errors.document_number?.message}
      >
        <Input
          id="document_number"
          autoComplete="off"
          maxLength={40}
          className="h-11"
          {...register('document_number')}
          {...fieldAriaProps('document_number', {
            error: errors.document_number?.message,
          })}
        />
      </FormField>
      <SupplierCategoriesField form={form} />
      {text('city', 'Ciudad', 80, { list: CITY_LIST_ID })}
      {text('coverage_zone', 'Zona de cobertura', 150)}
    </>
  );
}

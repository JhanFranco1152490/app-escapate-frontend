import { FormField, fieldAriaProps } from '@/components/form-field';
import { InternationalPhoneField } from '@/components/international-phone-field';
import { Input } from '@/components/ui/input';

import type { SupplierFormApi } from '../schemas';

// Un solo contacto por proveedor, con teléfono o correo (al menos uno de los dos).
export function SupplierContactFields({ form }: { form: SupplierFormApi }) {
  const {
    register,
    formState: { errors },
  } = form;
  const text = (
    name: 'contact_name' | 'contact_role' | 'contact_email',
    label: string,
    maxLength: number,
    required = false,
  ) => (
    <FormField
      id={name}
      label={label}
      required={required}
      error={errors[name]?.message}
    >
      <Input
        id={name}
        type={name === 'contact_email' ? 'email' : 'text'}
        autoComplete="off"
        maxLength={maxLength}
        className="h-11"
        {...register(name)}
        {...fieldAriaProps(name, { error: errors[name]?.message })}
      />
    </FormField>
  );

  return (
    <>
      {text('contact_name', 'Persona de contacto', 150, true)}
      {text('contact_role', 'Cargo o área', 80)}
      <InternationalPhoneField
        form={form}
        names={{ number: 'contact_phone', country: 'contact_phone_country' }}
      />
      {text('contact_email', 'Correo', 254)}
    </>
  );
}

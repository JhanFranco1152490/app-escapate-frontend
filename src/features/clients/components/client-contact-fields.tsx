import { FormField, fieldAriaProps } from '@/components/form-field';
import { Input } from '@/components/ui/input';

import type { ClientFormApi } from '../schemas';
import { ClientPhoneField } from './client-phone-field';
import { ContactSourceFields } from './contact-source-fields';

type ClientContactFieldsProps = {
  form: ClientFormApi;
  source: string;
  onPhoneCommit?: (e164: string | null) => void;
};

// Cómo se contacta al cliente y cómo llegó a la agencia.
export function ClientContactFields({
  form,
  source,
  onPhoneCommit,
}: ClientContactFieldsProps) {
  const {
    register,
    formState: { errors },
  } = form;
  const text = (name: 'email' | 'city', label: string, maxLength: number) => (
    <FormField id={name} label={label} error={errors[name]?.message}>
      <Input
        id={name}
        type={name === 'email' ? 'email' : 'text'}
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
      <ClientPhoneField form={form} onCommit={onPhoneCommit} />
      {text('email', 'Correo electrónico', 254)}
      {text('city', 'Ciudad', 80)}
      <ContactSourceFields form={form} source={source} />
    </>
  );
}

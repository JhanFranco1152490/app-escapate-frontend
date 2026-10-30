import { FormField, fieldAriaProps } from '@/components/form-field';
import { Input } from '@/components/ui/input';

import { CITY_SUGGESTIONS } from '../city-suggestions';
import type { ClientFormApi } from '../schemas';
import { ClientPhoneField } from './client-phone-field';
import { ContactSourceFields } from './contact-source-fields';

const CITY_LIST_ID = 'city-suggestions';

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
        list={name === 'city' ? CITY_LIST_ID : undefined}
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
      {/* Sugerencias nativas del navegador: proponen sin obligar a elegir de la lista. */}
      <datalist id={CITY_LIST_ID}>
        {CITY_SUGGESTIONS.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>
      <ContactSourceFields form={form} source={source} />
    </>
  );
}

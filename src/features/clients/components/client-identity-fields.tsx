import { FormField, fieldAriaProps } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { todayInBogota } from '@/lib/format/dates';
import { DOCUMENT_TYPE_NAMES } from '@/lib/format/document';

import type { ClientType } from '../api';
import { PERSON_DOCUMENT_TYPES } from '../labels';
import type { ClientFormApi } from '../schemas';

type ClientIdentityFieldsProps = {
  form: ClientFormApi;
  clientType: ClientType;
  documentType: string;
};

// Quién es el cliente: nombres o razón social, documento y, para una persona, su fecha de
// nacimiento. El documento es opcional (el primer contacto suele llegar sin la cédula).
export function ClientIdentityFields({
  form: {
    register,
    formState: { errors },
  },
  clientType,
  documentType,
}: ClientIdentityFieldsProps) {
  const person = clientType === 'person';
  const text = (
    name: 'first_name' | 'last_name' | 'business_name',
    label: string,
  ) => (
    <FormField
      key={name}
      id={name}
      label={label}
      required
      error={errors[name]?.message}
    >
      <Input
        id={name}
        autoComplete="off"
        className="h-11"
        {...register(name)}
        {...fieldAriaProps(name, { error: errors[name]?.message })}
      />
    </FormField>
  );
  const numberHint = person
    ? undefined
    : 'Con el dígito de verificación, con o sin guion.';

  return (
    <>
      {person ? (
        <>
          {text('first_name', 'Nombres')}
          {text('last_name', 'Apellidos')}
        </>
      ) : (
        <div className="md:col-span-2">
          {text('business_name', 'Razón social')}
        </div>
      )}
      <FormField id="document_type" label="Tipo de documento">
        {person ? (
          <NativeSelect
            id="document_type"
            className="w-full [&_select]:h-11"
            {...register('document_type')}
          >
            {PERSON_DOCUMENT_TYPES.map((type) => (
              <NativeSelectOption key={type} value={type}>
                {DOCUMENT_TYPE_NAMES[type]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        ) : (
          // Una empresa solo se registra con NIT: se muestra, pero no se elige. No se registra
          // en el formulario, porque un campo deshabilitado llega vacío al enviar.
          <NativeSelect
            id="document_type"
            className="w-full [&_select]:h-11"
            disabled
            value="NIT"
            onChange={() => undefined}
          >
            <NativeSelectOption value="NIT">NIT</NativeSelectOption>
          </NativeSelect>
        )}
      </FormField>
      <FormField
        id="document_number"
        label="Número de documento"
        hint={numberHint}
        error={errors.document_number?.message}
      >
        <Input
          id="document_number"
          autoComplete="off"
          // CE, PPT y pasaporte pueden llevar letras: la cédula y el NIT usan el teclado
          // numérico.
          inputMode={documentType === 'CC' || !person ? 'numeric' : 'text'}
          className="h-11"
          {...register('document_number')}
          {...fieldAriaProps('document_number', {
            error: errors.document_number?.message,
            hint: numberHint,
          })}
        />
      </FormField>
      {person && (
        <FormField
          id="birth_date"
          label="Fecha de nacimiento"
          error={errors.birth_date?.message}
        >
          <Input
            id="birth_date"
            type="date"
            min="1900-01-01"
            max={todayInBogota()}
            className="h-11"
            {...register('birth_date')}
            {...fieldAriaProps('birth_date', {
              error: errors.birth_date?.message,
            })}
          />
        </FormField>
      )}
    </>
  );
}

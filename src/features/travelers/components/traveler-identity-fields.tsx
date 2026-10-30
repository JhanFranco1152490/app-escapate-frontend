import { TriangleAlert } from 'lucide-react';
import { useWatch } from 'react-hook-form';

import { FormField, fieldAriaProps } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { todayInBogota } from '@/lib/format/dates';
import { DOCUMENT_TYPE_NAMES } from '@/lib/format/document';

import { documentAgeWarning } from '../document-age';
import { TRAVELER_DOCUMENT_TYPES, type TravelerFormApi } from '../schemas';
import { NationalityOptions } from './nationality-options';

const WARNING_ID = 'document-age-warning';

// Quién es el viajero tal como aparece en su documento: lo exigen aerolíneas y hoteles, por eso
// aquí el documento y la fecha de nacimiento son obligatorios.
export function TravelerIdentityFields({ form }: { form: TravelerFormApi }) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const [documentType, birthDate] = useWatch({
    control,
    name: ['document_type', 'birth_date'],
  });
  const warning = documentAgeWarning(documentType, birthDate, todayInBogota());
  const text = (name: 'first_name' | 'last_name', label: string) => (
    <FormField id={name} label={label} required error={errors[name]?.message}>
      <Input
        id={name}
        autoComplete="off"
        className="h-11"
        {...register(name)}
        {...fieldAriaProps(name, { error: errors[name]?.message })}
      />
    </FormField>
  );
  const numberError = errors.document_number?.message;
  const numberAria = fieldAriaProps('document_number', { error: numberError });

  return (
    <>
      {text('first_name', 'Nombres')}
      {text('last_name', 'Apellidos')}
      <FormField id="document_type" label="Tipo de documento" required>
        <NativeSelect
          id="document_type"
          className="w-full [&_select]:h-11"
          {...register('document_type')}
        >
          {TRAVELER_DOCUMENT_TYPES.map((type) => (
            <NativeSelectOption key={type} value={type}>
              {DOCUMENT_TYPE_NAMES[type]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>
      <FormField
        id="document_number"
        label="Número de documento"
        required
        error={numberError}
      >
        <Input
          id="document_number"
          autoComplete="off"
          // CE, PPT, pasaporte y los registros civiles antiguos pueden llevar letras.
          inputMode={
            documentType === 'CC' || documentType === 'TI' ? 'numeric' : 'text'
          }
          className="h-11"
          {...register('document_number')}
          {...numberAria}
          aria-describedby={
            [numberAria['aria-describedby'], warning && WARNING_ID]
              .filter(Boolean)
              .join(' ') || undefined
          }
        />
      </FormField>
      <FormField
        id="birth_date"
        label="Fecha de nacimiento"
        required
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
      <FormField
        id="nationality"
        label="Nacionalidad"
        required
        error={errors.nationality?.message}
      >
        <NativeSelect
          id="nationality"
          className="w-full [&_select]:h-11"
          {...register('nationality')}
          {...fieldAriaProps('nationality', {
            error: errors.nationality?.message,
          })}
        >
          <NationalityOptions />
        </NativeSelect>
      </FormField>
      {warning && (
        // Aviso y no error: el formulario se puede guardar igual.
        <p
          id={WARNING_ID}
          className="flex items-start gap-2 text-[0.78125rem] md:col-span-2"
        >
          <TriangleAlert
            aria-hidden="true"
            className="mt-0.5 size-3.5 shrink-0 text-orange-600"
          />
          {warning}
        </p>
      )}
    </>
  );
}

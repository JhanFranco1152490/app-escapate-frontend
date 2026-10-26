import { FormField, fieldAriaProps } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';

import { CONTACT_SOURCES, CONTACT_SOURCE_LABELS } from '../labels';
import type { ClientFormApi } from '../schemas';

type ContactSourceFieldsProps = {
  form: ClientFormApi;
  source: string;
};

// Cómo llegó el cliente a la agencia. "Otro" pide cuál y "Referido", quién lo refirió.
export function ContactSourceFields({
  form: {
    register,
    formState: { errors },
  },
  source,
}: ContactSourceFieldsProps) {
  const sourceError = errors.contact_source?.message;
  const detailError = errors.contact_source_detail?.message;
  const detailLabel =
    source === 'other'
      ? '¿Cuál?'
      : source === 'referral'
        ? '¿Quién lo refirió?'
        : null;

  return (
    <>
      <FormField
        id="contact_source"
        label="Medio de contacto"
        required
        error={sourceError}
      >
        <NativeSelect
          id="contact_source"
          className="w-full [&_select]:h-11"
          {...register('contact_source')}
          {...fieldAriaProps('contact_source', { error: sourceError })}
        >
          <NativeSelectOption value="" disabled>
            Elige cómo llegó
          </NativeSelectOption>
          {CONTACT_SOURCES.map((value) => (
            <NativeSelectOption key={value} value={value}>
              {CONTACT_SOURCE_LABELS[value]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>
      {detailLabel && (
        <FormField
          id="contact_source_detail"
          label={detailLabel}
          required={source === 'other'}
          error={detailError}
        >
          <Input
            id="contact_source_detail"
            autoComplete="off"
            maxLength={120}
            className="h-11"
            {...register('contact_source_detail')}
            {...fieldAriaProps('contact_source_detail', {
              error: detailError,
            })}
          />
        </FormField>
      )}
    </>
  );
}

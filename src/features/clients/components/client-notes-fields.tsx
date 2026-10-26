import Link from 'next/link';

import { ConsentField } from '@/components/consent-field';
import { FormField, fieldAriaProps } from '@/components/form-field';
import { Textarea } from '@/components/textarea';

import type { ClientFormApi } from '../schemas';

const NOTES_HINT = 'Visibles para todo el equipo comercial.';

type ClientNotesFieldsProps = {
  form: ClientFormApi;
  // La autorización solo se pide al registrar: después la ficha muestra quién la registró.
  withConsent: boolean;
};

export function ClientNotesFields({
  form: {
    register,
    formState: { errors },
  },
  withConsent,
}: ClientNotesFieldsProps) {
  return (
    <>
      <div className="md:col-span-2">
        <FormField
          id="notes"
          label="Notas"
          hint={NOTES_HINT}
          error={errors.notes?.message}
        >
          <Textarea
            id="notes"
            maxLength={2000}
            placeholder="Preferencias generales, restricciones, cómo llegó a la agencia…"
            {...register('notes')}
            {...fieldAriaProps('notes', {
              error: errors.notes?.message,
              hint: NOTES_HINT,
            })}
          />
        </FormField>
      </div>
      {withConsent && (
        <div className="md:col-span-2">
          <ConsentField
            field={register('data_consent')}
            error={errors.data_consent?.message}
          >
            El cliente autorizó el tratamiento de sus datos personales según la{' '}
            <Link
              href="/privacidad"
              target="_blank"
              className="underline underline-offset-4"
            >
              política de privacidad
            </Link>
            .
          </ConsentField>
        </div>
      )}
    </>
  );
}

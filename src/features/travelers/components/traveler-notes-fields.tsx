import { ConsentField } from '@/components/consent-field';
import { FormField, fieldAriaProps } from '@/components/form-field';
import { Textarea } from '@/components/textarea';

import type { TravelerFormApi } from '../schemas';

// Los datos de salud son sensibles y piden una autorización aparte: la ayuda lo dice.
const NOTES_HINT =
  'Preferencias de asiento, comida o habitación. No registres información de salud.';

type TravelerNotesFieldsProps = {
  form: TravelerFormApi;
  // La autorización solo se pide al registrar: después la ficha muestra quién la registró.
  withConsent: boolean;
};

export function TravelerNotesFields({
  form: {
    register,
    formState: { errors },
  },
  withConsent,
}: TravelerNotesFieldsProps) {
  return (
    <>
      <div className="md:col-span-2">
        <FormField
          id="notes"
          label="Observaciones"
          hint={NOTES_HINT}
          error={errors.notes?.message}
        >
          <Textarea
            id="notes"
            maxLength={1000}
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
            Se cuenta con la autorización del viajero, o de su representante
            legal si es menor de edad, para el tratamiento de sus datos.
          </ConsentField>
        </div>
      )}
    </>
  );
}

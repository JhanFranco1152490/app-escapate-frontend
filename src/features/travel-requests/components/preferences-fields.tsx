import { CheckboxGroup } from '@/components/checkbox-group';
import { FormField, fieldAriaProps } from '@/components/form-field';
import { Textarea } from '@/components/textarea';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';

import {
  ACCOMMODATION_CATEGORIES,
  ACCOMMODATION_LABELS,
  TRAVEL_TYPE_LABELS,
  TRAVEL_TYPES,
} from '../labels';
import type { RequestFormApi } from '../schemas';

const TRAVEL_TYPE_OPTIONS = TRAVEL_TYPES.map((value) => ({
  value,
  label: TRAVEL_TYPE_LABELS[value],
}));

const NOTES_HINT =
  'Preferencias y condiciones del cliente. No registres información de salud.';

export function PreferencesFields({
  form: {
    register,
    formState: { errors },
  },
}: {
  form: RequestFormApi;
}) {
  const notesError = errors.notes?.message;
  return (
    <>
      <CheckboxGroup
        id="trip_types"
        legend="Tipos de viaje"
        options={TRAVEL_TYPE_OPTIONS}
        registration={register('trip_types')}
        error={errors.trip_types?.message}
        className="md:col-span-2"
      />
      <FormField id="accommodation_category" label="Categoría de alojamiento">
        <NativeSelect
          id="accommodation_category"
          className="w-full"
          {...register('accommodation_category')}
        >
          <NativeSelectOption value="">Sin preferencia</NativeSelectOption>
          {ACCOMMODATION_CATEGORIES.map((category) => (
            <NativeSelectOption key={category} value={category}>
              {ACCOMMODATION_LABELS[category]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>
      <div className="md:col-span-2">
        <FormField
          id="notes"
          label="Condiciones y observaciones"
          hint={NOTES_HINT}
          error={notesError}
        >
          <Textarea
            id="notes"
            maxLength={2000}
            placeholder="Hotel cerca de la playa. Viajan con un coche de bebé."
            {...register('notes')}
            {...fieldAriaProps('notes', {
              error: notesError,
              hint: NOTES_HINT,
            })}
          />
        </FormField>
      </div>
    </>
  );
}

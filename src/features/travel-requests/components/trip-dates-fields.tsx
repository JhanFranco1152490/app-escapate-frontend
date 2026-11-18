import { Fragment } from 'react';
import { useWatch } from 'react-hook-form';

import { FormField, fieldAriaProps } from '@/components/form-field';
import { SegmentedChoice } from '@/components/segmented-choice';
import { Input } from '@/components/ui/input';

import type { DateMode } from '../api';
import type { RequestFormApi } from '../schemas';
import { DateInput } from './date-input';

const MODES: { value: DateMode; label: string }[] = [
  { value: 'exact', label: 'Fechas exactas' },
  { value: 'flexible', label: 'Período flexible' },
];

const DATE_FIELDS = [
  'departure_date',
  'return_date',
  'window_start',
  'window_end',
  'approx_nights',
] as const;

const NIGHTS_HINT =
  'Opcional. Cuántas noches, más o menos, dentro del período.';

// Fechas exactas o un período flexible ("en diciembre, unas 5 noches"). Al cambiar de modo,
// lo escrito en el otro se conserva por si la persona vuelve, pero no se valida ni se envía.
export function TripDatesFields({ form }: { form: RequestFormApi }) {
  const {
    control,
    register,
    setValue,
    clearErrors,
    formState: { errors },
  } = form;
  const mode = useWatch({ control, name: 'date_mode' });
  const nightsError = errors.approx_nights?.message;

  const changeMode = (value: DateMode) => {
    setValue('date_mode', value, { shouldDirty: true });
    clearErrors(DATE_FIELDS);
  };

  return (
    <>
      <div className="md:col-span-2">
        <SegmentedChoice
          legend="Tipo de fechas"
          name="date_mode"
          options={MODES}
          value={mode}
          onChange={changeMode}
        />
      </div>
      {/* Cada modo con su `key`: sin ella React reutiliza el mismo <input> para "Salida" y
          "Desde" (ocupan el mismo lugar) y uno mostraría la fecha escrita en el otro. */}
      {mode === 'exact' ? (
        <Fragment key="exact">
          <DateInput
            form={form}
            name="departure_date"
            label="Salida"
            required
          />
          <DateInput
            form={form}
            name="return_date"
            label="Regreso"
            hint="Vacío si todavía no se sabe."
          />
        </Fragment>
      ) : (
        <Fragment key="flexible">
          <DateInput form={form} name="window_start" label="Desde" required />
          <DateInput form={form} name="window_end" label="Hasta" required />
          <FormField
            id="approx_nights"
            label="Noches aproximadas"
            hint={NIGHTS_HINT}
            error={nightsError}
          >
            <Input
              id="approx_nights"
              inputMode="numeric"
              autoComplete="off"
              maxLength={3}
              className="h-11"
              {...register('approx_nights')}
              {...fieldAriaProps('approx_nights', {
                error: nightsError,
                hint: NIGHTS_HINT,
              })}
            />
          </FormField>
        </Fragment>
      )}
    </>
  );
}

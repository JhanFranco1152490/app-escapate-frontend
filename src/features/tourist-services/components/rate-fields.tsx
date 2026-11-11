import { useWatch } from 'react-hook-form';

import { DecimalAmountField } from '@/components/decimal-amount-field';
import { FormField, fieldAriaProps } from '@/components/form-field';
import { Textarea } from '@/components/textarea';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import type { Currency } from '@/lib/validation/amount';

import type { ServiceType } from '../api';
import type { ChargeUnit } from '../rate-api';
import {
  CHARGE_UNIT_LABELS,
  CHARGE_UNITS,
  CURRENCY_LABELS,
} from '../rate-options';
import type { RateFormApi } from '../rate-schemas';

const UNTIL_HINT = 'Vacío si no tiene fecha de fin.';

const capitalized = (text: string) => text[0].toUpperCase() + text.slice(1);

// Los campos de una tarifa. La etiqueta del valor dice la unidad y la moneda que se están
// usando ("Valor por noche (COP)"), para que nadie escriba dólares creyendo que son pesos.
export function RateFields({
  form,
  serviceType,
}: {
  form: RateFormApi;
  serviceType: ServiceType;
}) {
  const {
    control,
    register,
    getValues,
    trigger,
    formState: { errors },
  } = form;
  const [currency, unit] = useWatch({
    control,
    name: ['currency', 'charge_unit'],
  });
  const unitLabel = CHARGE_UNIT_LABELS[unit as ChargeUnit] ?? '';

  return (
    <>
      <FormField
        id="rate-name"
        label="Nombre de la tarifa"
        required
        error={errors.name?.message}
      >
        <Input
          id="rate-name"
          autoComplete="off"
          maxLength={100}
          placeholder="Temporada alta"
          className="h-11"
          {...register('name')}
          {...fieldAriaProps('rate-name', { error: errors.name?.message })}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="rate-valid-from"
          label="Vigente desde"
          required
          error={errors.valid_from?.message}
        >
          <Input
            id="rate-valid-from"
            type="date"
            className="h-11"
            {...register('valid_from')}
            {...fieldAriaProps('rate-valid-from', {
              error: errors.valid_from?.message,
            })}
          />
        </FormField>
        <FormField
          id="rate-valid-until"
          label="Hasta"
          hint={UNTIL_HINT}
          error={errors.valid_until?.message}
        >
          <Input
            id="rate-valid-until"
            type="date"
            className="h-11"
            {...register('valid_until')}
            {...fieldAriaProps('rate-valid-until', {
              error: errors.valid_until?.message,
              hint: UNTIL_HINT,
            })}
          />
        </FormField>
        <FormField id="rate-currency" label="Moneda" required>
          <NativeSelect
            id="rate-currency"
            className="w-full"
            {...register('currency', {
              // Un valor con centavos deja de valer al pasar a pesos: se marca enseguida.
              onChange: () => {
                if (getValues('amount')) void trigger('amount');
              },
            })}
          >
            {Object.entries(CURRENCY_LABELS).map(([code, label]) => (
              <NativeSelectOption key={code} value={code}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <FormField
          id="rate-charge-unit"
          label="Unidad de cobro"
          required
          error={errors.charge_unit?.message}
        >
          <NativeSelect
            id="rate-charge-unit"
            className="w-full"
            {...register('charge_unit')}
            {...fieldAriaProps('rate-charge-unit', {
              error: errors.charge_unit?.message,
            })}
          >
            {CHARGE_UNITS[serviceType].map((option) => (
              <NativeSelectOption key={option} value={option}>
                {capitalized(CHARGE_UNIT_LABELS[option])}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
      </div>
      <DecimalAmountField
        form={form}
        name="amount"
        label={`Valor ${unitLabel} (${currency})`}
        currency={currency as Currency}
        required
      />
      <FormField
        id="rate-conditions"
        label="Condiciones aplicables"
        error={errors.conditions?.message}
      >
        <Textarea
          id="rate-conditions"
          maxLength={1000}
          placeholder="Hasta 4 personas por habitación. Mínimo 5 noches."
          {...register('conditions')}
          {...fieldAriaProps('rate-conditions', {
            error: errors.conditions?.message,
          })}
        />
      </FormField>
    </>
  );
}

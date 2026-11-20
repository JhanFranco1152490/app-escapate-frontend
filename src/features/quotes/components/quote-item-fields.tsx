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

import type { ChargeUnit, ServiceType } from '../api';
import type { ItemFormApi } from '../schemas';
import {
  CHARGE_UNIT_LABELS,
  CHARGE_UNITS,
  CURRENCY_LABELS,
  SERVICE_TYPE_LABELS,
} from '../service-options';

const PERCENT_HINT = 'Se suma al costo para el precio de venta: 15 o 12,5.';
const COMMISSION_HINT = 'Solo de referencia: no cambia el precio.';

const capitalized = (text: string) => text[0].toUpperCase() + text.slice(1);

type TextFieldProps = {
  form: ItemFormApi;
  name:
    | 'name'
    | 'quantity'
    | 'start_date'
    | 'end_date'
    | 'markup_percent'
    | 'supplier_commission_percent';
  label: string;
  required?: boolean;
  hint?: string;
  type?: string;
  inputMode?: 'numeric' | 'decimal';
};

function TextField({
  form,
  name,
  label,
  required,
  hint,
  type,
  inputMode,
}: TextFieldProps) {
  const id = `item-${name}`;
  const error = form.formState.errors[name]?.message;
  return (
    <FormField
      id={id}
      label={label}
      required={required}
      hint={hint}
      error={error}
    >
      <Input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete="off"
        className="h-11"
        {...form.register(name)}
        {...fieldAriaProps(id, { error, hint })}
      />
    </FormField>
  );
}

// Los campos de un servicio de la cotización. Al cambiar el tipo, la unidad de cobro pasa a
// la primera de ese tipo: la anterior podría no valer.
export function QuoteItemFields({ form }: { form: ItemFormApi }) {
  const { control, register, setValue, getValues, trigger } = form;
  const [type, currency, unit] = useWatch({
    control,
    name: ['service_type', 'currency', 'charge_unit'],
  });
  const units = CHARGE_UNITS[type as ServiceType] ?? [];
  const unitLabel = CHARGE_UNIT_LABELS[unit as ChargeUnit] ?? '';

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="item-service-type" label="Tipo de servicio" required>
          <NativeSelect
            id="item-service-type"
            className="w-full"
            {...register('service_type', {
              onChange: (event: { target: { value: ServiceType } }) =>
                setValue('charge_unit', CHARGE_UNITS[event.target.value][0]),
            })}
          >
            {Object.entries(SERVICE_TYPE_LABELS).map(([code, label]) => (
              <NativeSelectOption key={code} value={code}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <FormField id="item-charge-unit" label="Unidad de cobro" required>
          <NativeSelect
            id="item-charge-unit"
            className="w-full"
            {...register('charge_unit')}
          >
            {units.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {capitalized(CHARGE_UNIT_LABELS[option])}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
      </div>
      <TextField form={form} name="name" label="Servicio" required />
      <FormField
        id="item-details"
        label="Detalle"
        error={form.formState.errors.details?.message}
      >
        <Textarea
          id="item-details"
          maxLength={2000}
          placeholder="Habitación doble con desayuno, vuelo directo, traslado privado…"
          {...register('details')}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField form={form} name="start_date" label="Desde" type="date" />
        <TextField form={form} name="end_date" label="Hasta" type="date" />
        <TextField
          form={form}
          name="quantity"
          label="Cantidad"
          required
          inputMode="numeric"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="item-currency" label="Moneda del proveedor" required>
          <NativeSelect
            id="item-currency"
            className="w-full"
            {...register('currency', {
              onChange: () => {
                if (getValues('unit_cost')) void trigger('unit_cost');
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
        <DecimalAmountField
          form={form}
          name="unit_cost"
          label={`Costo ${unitLabel} (${currency})`}
          currency={currency as Currency}
          required
        />
        <TextField
          form={form}
          name="markup_percent"
          label="% de ganancia"
          required
          hint={PERCENT_HINT}
          inputMode="decimal"
        />
        <TextField
          form={form}
          name="supplier_commission_percent"
          label="% de comisión del proveedor"
          hint={COMMISSION_HINT}
          inputMode="decimal"
        />
      </div>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          className="size-5 accent-orange-500"
          {...register('is_optional')}
        />
        Es opcional: el cliente decide si lo agrega
      </label>
    </>
  );
}

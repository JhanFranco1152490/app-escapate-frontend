import {
  get,
  type FieldValues,
  type Path,
  type PathValue,
  type UseFormReturn,
} from 'react-hook-form';

import { FormField, fieldAriaProps } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import { formatAmountInput } from '@/lib/format/money';
import { parseAmount, type Currency } from '@/lib/validation/amount';

const HINTS: Record<Currency, string> = {
  COP: 'Sin decimales: 710.000',
  USD: 'Punto para miles y coma para centavos: 1.250,50',
};

type AmountFormApi<T extends FieldValues> = Pick<
  UseFormReturn<T>,
  'register' | 'setValue' | 'formState'
>;

type DecimalAmountFieldProps<T extends FieldValues> = {
  form: AmountFormApi<T>;
  name: Path<T>;
  // Lleva la moneda, para que se vea en qué se está escribiendo: "Valor por noche (COP)".
  label: string;
  currency: Currency;
  required?: boolean;
};

// Un valor en pesos o en dólares escrito como en Colombia. El campo guarda el texto tal cual;
// al salir de él, si se entiende, se reescribe con los miles y los centavos para que la persona
// vea cómo quedó leído. Lo que no se entiende se deja igual para que lo corrija.
export function DecimalAmountField<T extends FieldValues>({
  form: {
    register,
    setValue,
    formState: { errors },
  },
  name,
  label,
  currency,
  required,
}: DecimalAmountFieldProps<T>) {
  const id = name;
  const error = get(errors, name)?.message as string | undefined;
  const hint = HINTS[currency];
  const amount = register(name, {
    onBlur: (event: { target: { value: string } }) => {
      const parsed = parseAmount(event.target.value, currency);
      if ('value' in parsed) {
        setValue(
          name,
          formatAmountInput(parsed.value, currency) as PathValue<T, Path<T>>,
        );
      }
    },
  });

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
        inputMode="decimal"
        autoComplete="off"
        maxLength={22}
        className="h-11"
        {...amount}
        {...fieldAriaProps(id, { error, hint })}
      />
    </FormField>
  );
}

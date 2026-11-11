import type { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import {
  AMOUNT_REQUIRED_MESSAGE,
  parseAmount,
  type Currency,
} from '@/lib/validation/amount';
import {
  REQUIRED_MESSAGE,
  optionalText,
  requiredText,
} from '@/lib/validation/text';

import type { ServiceType } from './api';
import type { ChargeUnit, ServiceRateCreate } from './rate-api';
import { CHARGE_UNITS, CURRENCY_LABELS } from './rate-options';

// Mismo mensaje que la API.
export const ENDS_BEFORE_START_MESSAGE =
  'La fecha final no puede ser anterior a la inicial.';
const UNKNOWN_OPTION_MESSAGE = 'No es una opción válida.';

// Los mensajes propios que significan "falta un dato", para contarlos en el aviso de arriba.
export const RATE_MISSING_MESSAGES = [AMOUNT_REQUIRED_MESSAGE];

const name = requiredText(100);
const conditions = optionalText(1000);

const formShape = z.object({
  name: z.string(),
  valid_from: z.string(),
  valid_until: z.string(),
  currency: z.string(),
  charge_unit: z.string(),
  amount: z.string(),
  conditions: z.string(),
});

export type RateFormValues = z.input<typeof formShape>;
export type RatePayload = ServiceRateCreate;
export type RateFormApi = UseFormReturn<RateFormValues, unknown, RatePayload>;

const firstError = (schema: z.ZodType, value: unknown) =>
  schema.safeParse(value).error?.issues[0]?.message;

const isCurrency = (value: string): value is Currency =>
  value in CURRENCY_LABELS;

// La unidad de cobro depende del tipo del servicio: un alojamiento se cobra por noche, un
// crucero por cabina. Lo demás es igual para todos.
export function rateFormSchema(type: ServiceType) {
  const units: readonly string[] = CHARGE_UNITS[type];
  return formShape
    .superRefine((values, ctx) => {
      const amount = isCurrency(values.currency)
        ? parseAmount(values.amount, values.currency)
        : undefined;
      const errors = {
        name: firstError(name, values.name),
        valid_from: values.valid_from ? undefined : REQUIRED_MESSAGE,
        // Las fechas llegan como yyyy-MM-dd: compararlas como texto da el orden correcto.
        valid_until:
          values.valid_from &&
          values.valid_until &&
          values.valid_until < values.valid_from
            ? ENDS_BEFORE_START_MESSAGE
            : undefined,
        currency: isCurrency(values.currency)
          ? undefined
          : UNKNOWN_OPTION_MESSAGE,
        charge_unit: units.includes(values.charge_unit)
          ? undefined
          : UNKNOWN_OPTION_MESSAGE,
        amount: amount && 'error' in amount ? amount.error : undefined,
        conditions: firstError(conditions, values.conditions),
      };
      for (const [path, message] of Object.entries(errors)) {
        if (message) ctx.addIssue({ code: 'custom', path: [path], message });
      }
    })
    .transform((values): RatePayload => {
      // Solo llega aquí si pasó las reglas: la moneda y el valor son válidos.
      const currency = values.currency as Currency;
      const amount = parseAmount(values.amount, currency) as { value: string };
      return {
        name: values.name.trim(),
        valid_from: values.valid_from,
        valid_until: values.valid_until || null,
        currency,
        charge_unit: values.charge_unit as ChargeUnit,
        amount: amount.value,
        conditions: values.conditions.trim() || null,
      };
    });
}

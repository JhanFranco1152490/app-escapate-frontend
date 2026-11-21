import type { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { parseAmount, type Currency } from '@/lib/validation/amount';
import { parsePercent } from '@/lib/validation/percent';
import {
  REQUIRED_MESSAGE,
  optionalMultilineText,
  optionalText,
  requiredText,
} from '@/lib/validation/text';

import type { ChargeUnit, QuoteItemCreate, ServiceType } from './api';

// Mismos mensajes que la API.
export const BEFORE_START_MESSAGE =
  'No puede ser anterior a la fecha de inicio.';
const COUNT_MESSAGE = (min: number) =>
  `Indica un número entero de ${min} a 99.`;
const QUANTITY_MESSAGE = 'Indica un número entero de 1 a 9999.';

const firstError = (schema: z.ZodType, value: unknown) =>
  schema.safeParse(value).error?.issues[0]?.message;

const integerIn = (text: string, min: number, max: number) => {
  if (!/^\d+$/.test(text.trim())) return null;
  const value = Number(text);
  return value >= min && value <= max ? value : null;
};

type Errors = Record<string, string | undefined>;

function addErrors(errors: Errors, ctx: z.RefinementCtx) {
  for (const [path, message] of Object.entries(errors)) {
    if (message) ctx.addIssue({ code: 'custom', path: [path], message });
  }
}

// --- Datos generales ----------------------------------------------------------------------

const destination = requiredText(150);
const origin = optionalText(120);
const longText = optionalMultilineText(4000);

const generalShape = z.object({
  destination: z.string(),
  origin: z.string(),
  departure_date: z.string(),
  return_date: z.string(),
  adults: z.string(),
  minors: z.string(),
  valid_until: z.string(),
  notes: z.string(),
});

export type GeneralFormValues = z.input<typeof generalShape>;

export const generalSchema = generalShape
  .superRefine((values, ctx) =>
    addErrors(
      {
        destination: firstError(destination, values.destination),
        origin: firstError(origin, values.origin),
        // Las fechas llegan como yyyy-MM-dd: compararlas como texto da el orden correcto.
        return_date:
          values.departure_date &&
          values.return_date &&
          values.return_date < values.departure_date
            ? BEFORE_START_MESSAGE
            : undefined,
        adults:
          integerIn(values.adults, 1, 99) === null
            ? COUNT_MESSAGE(1)
            : undefined,
        minors:
          integerIn(values.minors, 0, 99) === null
            ? COUNT_MESSAGE(0)
            : undefined,
        valid_until: values.valid_until ? undefined : REQUIRED_MESSAGE,
        notes: firstError(longText, values.notes),
      },
      ctx,
    ),
  )
  .transform((values) => ({
    destination: values.destination.trim(),
    origin: values.origin.trim() || null,
    departure_date: values.departure_date || null,
    return_date: values.return_date || null,
    adults: Number(values.adults),
    minors: Number(values.minors),
    valid_until: values.valid_until,
    notes: values.notes.replace(/\r\n?/g, '\n').trim() || null,
  }));

export type GeneralPayload = z.output<typeof generalSchema>;

// --- Condiciones comerciales --------------------------------------------------------------

const conditionsShape = z.object({
  deposit_percent: z.string(),
  balance_due_date: z.string(),
  payment_terms: z.string(),
  policies: z.string(),
});

export type ConditionsFormValues = z.input<typeof conditionsShape>;

const depositPercent = (text: string) =>
  text.trim()
    ? parsePercent(text, { min: 0, max: 100, minInclusive: false })
    : null;

export const conditionsSchema = conditionsShape
  .superRefine((values, ctx) => {
    const deposit = depositPercent(values.deposit_percent);
    addErrors(
      {
        deposit_percent:
          deposit && 'error' in deposit ? deposit.error : undefined,
        payment_terms: firstError(longText, values.payment_terms),
        policies: firstError(longText, values.policies),
      },
      ctx,
    );
  })
  .transform((values) => {
    const deposit = depositPercent(values.deposit_percent) as {
      value: string;
    } | null;
    return {
      deposit_percent: deposit?.value ?? null,
      balance_due_date: values.balance_due_date || null,
      payment_terms:
        values.payment_terms.replace(/\r\n?/g, '\n').trim() || null,
      policies: values.policies.replace(/\r\n?/g, '\n').trim() || null,
    };
  });

export type ConditionsPayload = z.output<typeof conditionsSchema>;

// --- Servicio de la cotización ------------------------------------------------------------

const itemName = requiredText(150);
const itemDetails = optionalMultilineText(2000);

const itemShape = z.object({
  service_type: z.string(),
  name: z.string(),
  details: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  quantity: z.string(),
  charge_unit: z.string(),
  is_optional: z.boolean(),
  alternative_of_id: z.string(),
  tourist_service_id: z.string(),
  currency: z.string(),
  unit_cost: z.string(),
  markup_percent: z.string(),
  sale_price_override: z.string(),
  supplier_commission_percent: z.string(),
});

export type ItemFormValues = z.input<typeof itemShape>;
export type ItemPayload = QuoteItemCreate;
export type ItemFormApi = UseFormReturn<ItemFormValues, unknown, ItemPayload>;

const markup = (text: string) => parsePercent(text, { min: 0, max: 999.99 });
const commission = (text: string) =>
  text.trim() ? parsePercent(text, { min: 0, max: 100 }) : null;
// Precio total escrito a mano, en pesos: vacío deja el calculado con el %.
const override = (text: string) =>
  text.trim() ? parseAmount(text, 'COP') : null;
const isCurrency = (value: string): value is Currency =>
  value === 'COP' || value === 'USD';

export const itemSchema = itemShape
  .superRefine((values, ctx) => {
    const cost = isCurrency(values.currency)
      ? parseAmount(values.unit_cost, values.currency)
      : undefined;
    const markupValue = markup(values.markup_percent);
    const commissionValue = commission(values.supplier_commission_percent);
    const overrideValue = override(values.sale_price_override);
    addErrors(
      {
        name: firstError(itemName, values.name),
        details: firstError(itemDetails, values.details),
        end_date:
          values.start_date &&
          values.end_date &&
          values.end_date < values.start_date
            ? BEFORE_START_MESSAGE
            : undefined,
        quantity:
          integerIn(values.quantity, 1, 9999) === null
            ? QUANTITY_MESSAGE
            : undefined,
        unit_cost: cost && 'error' in cost ? cost.error : undefined,
        markup_percent: 'error' in markupValue ? markupValue.error : undefined,
        sale_price_override:
          overrideValue && 'error' in overrideValue
            ? overrideValue.error
            : undefined,
        supplier_commission_percent:
          commissionValue && 'error' in commissionValue
            ? commissionValue.error
            : undefined,
      },
      ctx,
    );
  })
  .transform((values): ItemPayload => {
    // Solo llega aquí si pasó las reglas.
    const currency = values.currency as Currency;
    const cost = parseAmount(values.unit_cost, currency) as { value: string };
    const commissionValue = commission(values.supplier_commission_percent) as {
      value: string;
    } | null;
    return {
      service_type: values.service_type as ServiceType,
      name: values.name.trim(),
      details: values.details.replace(/\r\n?/g, '\n').trim() || null,
      start_date: values.start_date || null,
      end_date: values.end_date || null,
      quantity: Number(values.quantity),
      charge_unit: (values.charge_unit || null) as ChargeUnit | null,
      is_optional: values.is_optional,
      alternative_of_id: values.alternative_of_id
        ? Number(values.alternative_of_id)
        : null,
      tourist_service_id: values.tourist_service_id
        ? Number(values.tourist_service_id)
        : null,
      currency,
      unit_cost: cost.value,
      markup_percent: (markup(values.markup_percent) as { value: string })
        .value,
      supplier_commission_percent: commissionValue?.value ?? null,
    };
  });

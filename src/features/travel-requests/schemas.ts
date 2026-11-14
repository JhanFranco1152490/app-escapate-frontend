import type { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { todayInBogota } from '@/lib/format/dates';
import { parseAmount } from '@/lib/validation/amount';
import {
  REQUIRED_MESSAGE,
  optionalMultilineText,
  optionalText,
  requiredText,
} from '@/lib/validation/text';

import type {
  AccommodationCategory,
  TravelRequestCreate,
  TravelType,
} from './api';
import {
  DEPARTURE_REQUIRED,
  END_REQUIRED,
  START_REQUIRED,
  parseInteger,
  tripDateErrors,
  type OriginalDates,
} from './date-rules';
import { ACCOMMODATION_CATEGORIES, TRAVEL_TYPES } from './labels';

// Mismos mensajes que la API.
const BELOW_MINIMUM = 'No puede ser menor que el mínimo.';
export const INELIGIBLE_ADVISOR =
  'Elige un asesor activo que pueda gestionar solicitudes.';
const ADULTS_RANGE = 'Indica un número entero de 1 a 99.';
const MINORS_RANGE = 'Indica un número entero de 0 a 99.';

// Los mensajes propios que significan "falta un dato", para contarlos en el aviso de arriba.
export const REQUEST_MISSING_MESSAGES = [
  DEPARTURE_REQUIRED,
  START_REQUIRED,
  END_REQUIRED,
];

const destination = requiredText(150);
const origin = optionalText(120);
const notes = optionalMultilineText(2000);

// Todo como texto, como lo dan los campos; el cliente elegido trae su nombre para mostrarlo.
const formShape = z.object({
  client_id: z.number().nullable(),
  client_name: z.string(),
  destination: z.string(),
  origin: z.string(),
  date_mode: z.enum(['exact', 'flexible']),
  departure_date: z.string(),
  return_date: z.string(),
  window_start: z.string(),
  window_end: z.string(),
  approx_nights: z.string(),
  adults: z.string(),
  minors: z.string(),
  budget_min: z.string(),
  budget_max: z.string(),
  trip_types: z.array(z.string()),
  accommodation_category: z.string(),
  assigned_to_id: z.string(),
  notes: z.string(),
});

export type RequestFormValues = z.input<typeof formShape>;
export type RequestPayload = TravelRequestCreate;
export type RequestFormApi = UseFormReturn<
  RequestFormValues,
  unknown,
  RequestPayload
>;

type SchemaOptions = {
  // Al editar: las fechas guardadas, que se aceptan aunque ya hayan pasado.
  original?: OriginalDates;
  // Los asesores que se pueden elegir; mientras no cargan no se revisa.
  advisorIds?: number[];
  today?: () => string;
};

const firstError = (schema: z.ZodType, value: unknown) =>
  schema.safeParse(value).error?.issues[0]?.message;

// Pesos enteros, opcional: vacío es "sin presupuesto". Como son pesos sin centavos y no pasan
// de 999.999.999.999, caben en un número sin perder precisión.
function parseBudget(text: string) {
  if (!text.trim()) return { value: null };
  const parsed = parseAmount(text, 'COP');
  return 'error' in parsed ? parsed : { value: Number(parsed.value) };
}

// Para el cuerpo, cuando las reglas ya aceptaron el presupuesto.
const budgetValue = (text: string) => {
  const parsed = parseBudget(text);
  return 'value' in parsed ? parsed.value : null;
};

export function travelRequestSchema({
  original,
  advisorIds,
  today = todayInBogota,
}: SchemaOptions = {}) {
  return formShape
    .superRefine((values, ctx) => {
      const min = parseBudget(values.budget_min);
      const max = parseBudget(values.budget_max);
      const advisor = Number(values.assigned_to_id);
      const errors = {
        client_id: values.client_id === null ? REQUIRED_MESSAGE : undefined,
        destination: firstError(destination, values.destination),
        origin: firstError(origin, values.origin),
        ...tripDateErrors(values, today(), original),
        adults:
          parseInteger(values.adults, 1, 99) === undefined
            ? ADULTS_RANGE
            : undefined,
        minors:
          parseInteger(values.minors, 0, 99) === undefined
            ? MINORS_RANGE
            : undefined,
        budget_min: 'error' in min ? min.error : undefined,
        budget_max:
          'error' in max
            ? max.error
            : 'value' in min && min.value && max.value && max.value < min.value
              ? BELOW_MINIMUM
              : undefined,
        assigned_to_id: !values.assigned_to_id
          ? REQUIRED_MESSAGE
          : advisorIds && !advisorIds.includes(advisor)
            ? INELIGIBLE_ADVISOR
            : undefined,
        notes: firstError(notes, values.notes),
      };
      for (const [path, message] of Object.entries(errors)) {
        if (message) ctx.addIssue({ code: 'custom', path: [path], message });
      }
    })
    .transform((values): RequestPayload => {
      // Solo llega aquí si pasó las reglas: cada conversión es válida.
      const exact = values.date_mode === 'exact';
      const dates = exact
        ? {
            departure_date: values.departure_date,
            return_date: values.return_date || null,
          }
        : {
            window_start: values.window_start,
            window_end: values.window_end,
            approx_nights: values.approx_nights.trim()
              ? Number(values.approx_nights)
              : null,
          };
      return {
        client_id: values.client_id!,
        destination: values.destination.trim(),
        origin: values.origin.trim() || null,
        date_mode: values.date_mode,
        ...dates,
        adults: Number(values.adults),
        minors: Number(values.minors),
        budget_min: budgetValue(values.budget_min),
        budget_max: budgetValue(values.budget_max),
        trip_types: TRAVEL_TYPES.filter((type: TravelType) =>
          values.trip_types.includes(type),
        ),
        accommodation_category: ACCOMMODATION_CATEGORIES.includes(
          values.accommodation_category as AccommodationCategory,
        )
          ? (values.accommodation_category as AccommodationCategory)
          : null,
        assigned_to_id: Number(values.assigned_to_id),
        notes: notes.parse(values.notes),
      };
    });
}

import {
  optionalText,
  requiredText,
  REQUIRED_MESSAGE,
} from '@/lib/validation/text';

import type { ServiceType } from './api';
import {
  CABIN_CLASS_LABELS,
  CABIN_KIND_LABELS,
  CRUISE_INCLUDE_LABELS,
  DURATION_UNIT_LABELS,
  LODGING_INCLUDE_LABELS,
  LODGING_KIND_LABELS,
  MEAL_LABELS,
  MEAL_PLAN_LABELS,
  MODALITY_LABELS,
  SERVICE_STYLE_LABELS,
  TOURS_INCLUDE_LABELS,
  TRIP_TYPE_LABELS,
  VEHICLE_KIND_LABELS,
  WHOLESALER_INCLUDE_LABELS,
} from './service-options';

// Mismos mensajes que la API cuando ella los tiene; los rangos los dice el navegador primero
// porque los de la API no están en español.
export const MEALS_REQUIRED_MESSAGE = 'Elige al menos una comida.';
const UNKNOWN_OPTION_MESSAGE = 'No es una opción válida.';
const INVALID_TIME_MESSAGE = 'Indica la hora en horas y minutos.';
const rangeMessage = (min: number, max: number) =>
  `Indica un número entero de ${min} a ${max}.`;

const WHOLE_NUMBER = /^\d+$/;
const CLOCK_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// Los campos propios de todos los tipos, como texto del formulario. Varios tipos comparten un
// nombre (`origin`, `nights`, `includes`) con reglas distintas: solo se lee el del tipo elegido.
export type AttributeFormValues = {
  lodging_kind: string;
  stars: string;
  meal_plan: string;
  max_capacity: string;
  check_in_time: string;
  check_out_time: string;
  origin: string;
  trip_type: string;
  cabin_class: string;
  stops: string;
  carry_on_included: boolean;
  checked_bags: string;
  modality: string;
  vehicle_kind: string;
  duration_value: string;
  duration_unit: string;
  meeting_point: string;
  ship_name: string;
  departure_port: string;
  nights: string;
  cabin_kind: string;
  itinerary: string;
  meals: string[];
  service_style: string;
  cuisine: string;
  departure_city: string;
  includes: string[];
};

export type AttributeField = keyof AttributeFormValues;
export type TextField = {
  [K in AttributeField]: AttributeFormValues[K] extends string ? K : never;
}[AttributeField];

type AttributeErrors = Partial<Record<AttributeField, string>>;

// Lee los campos del tipo elegido, anota el error de cada uno y devuelve su valor para la API
// (null si quedó vacío o con error).
function reader(values: AttributeFormValues) {
  const errors: AttributeErrors = {};
  const fail = (field: AttributeField, message: string) => {
    errors[field] = message;
    return null;
  };

  const choice = <T extends string>(
    field: TextField,
    labels: Record<T, string>,
    required = false,
  ): T | null => {
    const value = values[field];
    if (!value) return required ? fail(field, REQUIRED_MESSAGE) : null;
    return value in labels ? (value as T) : fail(field, UNKNOWN_OPTION_MESSAGE);
  };

  const integer = (
    field: TextField,
    min: number,
    max: number,
    required = false,
  ) => {
    const value = values[field].trim();
    if (!value) return required ? fail(field, REQUIRED_MESSAGE) : null;
    const number = WHOLE_NUMBER.test(value) ? Number(value) : NaN;
    return number >= min && number <= max
      ? number
      : fail(field, rangeMessage(min, max));
  };

  const text = (field: TextField, max: number, required = false) => {
    const result = (required ? requiredText(max) : optionalText(max)).safeParse(
      values[field],
    );
    return result.success
      ? result.data || null
      : fail(field, result.error.issues[0].message);
  };

  const time = (field: TextField) => {
    const value = values[field];
    if (!value) return null;
    return CLOCK_TIME.test(value) ? value : fail(field, INVALID_TIME_MESSAGE);
  };

  // Casillas: en el orden de su lista, que es como la API las devuelve.
  const many = <T extends string>(
    field: 'includes' | 'meals',
    labels: Record<T, string>,
    requiredMessage?: string,
  ) => {
    const picked = (Object.keys(labels) as T[]).filter((option) =>
      values[field].includes(option),
    );
    if (!picked.length && requiredMessage) fail(field, requiredMessage);
    return picked;
  };

  return { errors, choice, integer, text, time, many };
}

type AttributeResult = { errors: AttributeErrors; attributes: object };
type Reader = ReturnType<typeof reader>;

const READERS: Record<
  ServiceType,
  (read: Reader, values: AttributeFormValues) => object
> = {
  lodging: (read) => ({
    lodging_kind: read.choice('lodging_kind', LODGING_KIND_LABELS, true),
    stars: read.integer('stars', 1, 5),
    meal_plan: read.choice('meal_plan', MEAL_PLAN_LABELS),
    max_capacity: read.integer('max_capacity', 1, 50, true),
    check_in_time: read.time('check_in_time'),
    check_out_time: read.time('check_out_time'),
    includes: read.many('includes', LODGING_INCLUDE_LABELS),
  }),
  air: (read, values) => ({
    origin: read.text('origin', 120, true),
    trip_type: read.choice('trip_type', TRIP_TYPE_LABELS, true),
    cabin_class: read.choice('cabin_class', CABIN_CLASS_LABELS),
    stops: read.integer('stops', 0, 3),
    carry_on_included: values.carry_on_included,
    checked_bags: read.integer('checked_bags', 0, 5),
  }),
  ground: (read) => ({
    modality: read.choice('modality', MODALITY_LABELS, true),
    vehicle_kind: read.choice('vehicle_kind', VEHICLE_KIND_LABELS),
    origin: read.text('origin', 120),
    max_capacity: read.integer('max_capacity', 1, 60),
  }),
  tours: (read) => ({
    duration_value: read.integer('duration_value', 1, 999, true),
    duration_unit: read.choice('duration_unit', DURATION_UNIT_LABELS, true),
    modality: read.choice('modality', MODALITY_LABELS),
    meeting_point: read.text('meeting_point', 200),
    includes: read.many('includes', TOURS_INCLUDE_LABELS),
  }),
  cruise: (read) => ({
    ship_name: read.text('ship_name', 120, true),
    departure_port: read.text('departure_port', 120, true),
    nights: read.integer('nights', 1, 60, true),
    cabin_kind: read.choice('cabin_kind', CABIN_KIND_LABELS),
    itinerary: read.text('itinerary', 500),
    includes: read.many('includes', CRUISE_INCLUDE_LABELS),
  }),
  food: (read) => ({
    meals: read.many('meals', MEAL_LABELS, MEALS_REQUIRED_MESSAGE),
    service_style: read.choice('service_style', SERVICE_STYLE_LABELS),
    cuisine: read.text('cuisine', 80),
  }),
  wholesaler: (read) => ({
    // 0 noches es un pasadía.
    nights: read.integer('nights', 0, 60, true),
    departure_city: read.text('departure_city', 120),
    includes: read.many('includes', WHOLESALER_INCLUDE_LABELS),
  }),
  // Sin campos propios: el servicio se describe en su descripción.
  other: () => ({}),
};

// Valida solo los campos del tipo elegido y arma sus atributos para la API: lo que quedó
// escrito de otro tipo no se envía.
export function readAttributes(
  type: ServiceType,
  values: AttributeFormValues,
): AttributeResult {
  const read = reader(values);
  const attributes = READERS[type](read, values);
  return { errors: read.errors, attributes };
}

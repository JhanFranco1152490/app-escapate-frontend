import type { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { SUPPLIER_CATEGORIES } from '@/features/suppliers/categories';
import { optionalText, requiredText } from '@/lib/validation/text';

import type { ServiceType, TouristServiceCreate } from './api';
import { MEALS_REQUIRED_MESSAGE, readAttributes } from './attribute-rules';

export { MEALS_REQUIRED_MESSAGE };
export type {
  AttributeField,
  AttributeFormValues,
  TextField,
} from './attribute-rules';

export const SERVICE_TYPE_REQUIRED_MESSAGE = 'Elige el tipo de servicio.';

// Los mensajes propios que significan "falta un dato", para contarlos en el aviso de arriba.
export const MISSING_MESSAGES = [
  SERVICE_TYPE_REQUIRED_MESSAGE,
  MEALS_REQUIRED_MESSAGE,
];

const name = requiredText(150);
const destination = requiredText(120);
const longText = optionalText(2000);

// Todo llega como texto del formulario. Las reglas van en el `superRefine` para que todos los
// errores salgan juntos, cada uno en su campo, también los de los atributos del tipo.
const formShape = z.object({
  service_type: z.string(),
  name: z.string(),
  destination: z.string(),
  description: z.string(),
  conditions: z.string(),
  attributes: z.object({
    lodging_kind: z.string(),
    stars: z.string(),
    meal_plan: z.string(),
    max_capacity: z.string(),
    check_in_time: z.string(),
    check_out_time: z.string(),
    origin: z.string(),
    trip_type: z.string(),
    cabin_class: z.string(),
    stops: z.string(),
    carry_on_included: z.boolean(),
    checked_bags: z.string(),
    modality: z.string(),
    vehicle_kind: z.string(),
    duration_value: z.string(),
    duration_unit: z.string(),
    meeting_point: z.string(),
    ship_name: z.string(),
    departure_port: z.string(),
    nights: z.string(),
    cabin_kind: z.string(),
    itinerary: z.string(),
    meals: z.array(z.string()),
    service_style: z.string(),
    cuisine: z.string(),
    departure_city: z.string(),
    includes: z.array(z.string()),
  }),
});

export type ServiceFormValues = z.input<typeof formShape>;
export type ServicePayload = TouristServiceCreate;
// El formulario tal como lo reciben las piezas que lo componen.
export type ServiceFormApi = UseFormReturn<
  ServiceFormValues,
  unknown,
  ServicePayload
>;

const isServiceType = (value: string): value is ServiceType =>
  (SUPPLIER_CATEGORIES as string[]).includes(value);

const firstError = (schema: z.ZodType, value: unknown) =>
  schema.safeParse(value).error?.issues[0]?.message;

export const serviceFormSchema = formShape
  .superRefine((values, ctx) => {
    const common = {
      service_type: isServiceType(values.service_type)
        ? undefined
        : SERVICE_TYPE_REQUIRED_MESSAGE,
      name: firstError(name, values.name),
      destination: firstError(destination, values.destination),
      description: firstError(longText, values.description),
      conditions: firstError(longText, values.conditions),
    };
    for (const [path, message] of Object.entries(common)) {
      if (message) ctx.addIssue({ code: 'custom', path: [path], message });
    }
    if (!isServiceType(values.service_type)) return;
    const { errors } = readAttributes(values.service_type, values.attributes);
    for (const [field, message] of Object.entries(errors)) {
      ctx.addIssue({ code: 'custom', path: ['attributes', field], message });
    }
  })
  .transform((values): ServicePayload => {
    // Solo llega aquí si pasó las reglas: el tipo es uno de la lista.
    const type = values.service_type as ServiceType;
    const trimmed = (value: string) => value.trim() || null;
    return {
      service_type: type,
      name: values.name.trim(),
      destination: values.destination.trim(),
      description: trimmed(values.description),
      conditions: trimmed(values.conditions),
      attributes: readAttributes(type, values.attributes)
        .attributes as ServicePayload['attributes'],
    };
  });

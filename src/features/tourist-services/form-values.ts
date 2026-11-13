import type { ServiceType, TouristServiceDetail } from './api';
import { typedService } from './attributes';
import type { AttributeFormValues, ServiceFormValues } from './schemas';

// Los campos propios vacíos. La duración viene en horas porque casi todos los tours se miden
// así; el resto lo elige la persona.
export const EMPTY_ATTRIBUTES: AttributeFormValues = {
  lodging_kind: '',
  stars: '',
  meal_plan: '',
  max_capacity: '',
  check_in_time: '',
  check_out_time: '',
  origin: '',
  trip_type: '',
  cabin_class: '',
  stops: '',
  carry_on_included: false,
  checked_bags: '',
  modality: '',
  vehicle_kind: '',
  duration_value: '',
  duration_unit: 'hours',
  meeting_point: '',
  ship_name: '',
  departure_port: '',
  nights: '',
  cabin_kind: '',
  itinerary: '',
  meals: [],
  service_style: '',
  cuisine: '',
  departure_city: '',
  includes: [],
};

// Un proveedor con una sola clasificación solo puede registrar servicios de ese tipo: ya
// viene elegido.
export const emptyServiceForm = (
  types: readonly ServiceType[] = [],
): ServiceFormValues => ({
  service_type: types.length === 1 ? types[0] : '',
  name: '',
  destination: '',
  description: '',
  conditions: '',
  attributes: EMPTY_ATTRIBUTES,
});

// Lo que la API guarda como número o ausente pasa a texto del formulario.
function attributeFormValues(attributes: object): AttributeFormValues {
  const values = { ...EMPTY_ATTRIBUTES };
  for (const [field, value] of Object.entries(attributes)) {
    if (!(field in values) || value === null || value === undefined) continue;
    (values as Record<string, unknown>)[field] =
      typeof value === 'number' ? String(value) : value;
  }
  return values;
}

export function serviceFormValues(
  service: TouristServiceDetail,
): ServiceFormValues {
  const typed = typedService(service);
  return {
    service_type: typed.service_type,
    name: typed.name,
    destination: typed.destination,
    description: typed.description ?? '',
    conditions: typed.conditions ?? '',
    attributes: attributeFormValues(typed.attributes),
  };
}

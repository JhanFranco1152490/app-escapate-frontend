import type { ReactNode } from 'react';

import type { TypedTouristService } from './attributes';
import {
  CABIN_CLASS_LABELS,
  CABIN_KIND_LABELS,
  CRUISE_INCLUDE_LABELS,
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

export type AttributeDetail = { term: string; value: ReactNode };

// "1 noche", "4 noches": la forma según el número.
const count = (value: number, one: string, many: string) =>
  `${value} ${value === 1 ? one : many}`;

const labelOf = <T extends string>(
  labels: Record<T, string>,
  value: T | null | undefined,
) => (value ? labels[value] : null);

function IncludesList<T extends string>({
  labels,
  values,
}: {
  labels: Record<T, string>;
  values: T[];
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {values.map((value) => (
        <li key={value}>{labels[value]}</li>
      ))}
    </ul>
  );
}

const includes = <T extends string>(
  labels: Record<T, string>,
  values: T[] | undefined,
) => (values?.length ? <IncludesList labels={labels} values={values} /> : null);

// Los datos propios del tipo del servicio, con sus etiquetas. Lo que no se diligenció no se
// muestra: un "Sin especificar" por cada opcional llenaría la ficha de ruido.
function detailsOf(service: TypedTouristService): [string, ReactNode][] {
  switch (service.service_type) {
    case 'lodging': {
      const a = service.attributes;
      return [
        ['Tipo de alojamiento', LODGING_KIND_LABELS[a.lodging_kind]],
        ['Categoría', a.stars && count(a.stars, 'estrella', 'estrellas')],
        ['Régimen', labelOf(MEAL_PLAN_LABELS, a.meal_plan)],
        ['Capacidad máxima', count(a.max_capacity, 'persona', 'personas')],
        ['Check-in', a.check_in_time],
        ['Check-out', a.check_out_time],
        ['Incluye', includes(LODGING_INCLUDE_LABELS, a.includes)],
      ];
    }
    case 'air': {
      const a = service.attributes;
      return [
        ['Origen', a.origin],
        ['Trayecto', TRIP_TYPE_LABELS[a.trip_type]],
        ['Clase', labelOf(CABIN_CLASS_LABELS, a.cabin_class)],
        [
          'Escalas',
          a.stops === 0
            ? 'Directo'
            : a.stops && count(a.stops, 'escala', 'escalas'),
        ],
        ['Equipaje de mano', a.carry_on_included ? 'Incluido' : 'No incluido'],
        [
          'Maletas en bodega',
          a.checked_bags === 0
            ? 'Sin maletas en bodega'
            : a.checked_bags && count(a.checked_bags, 'maleta', 'maletas'),
        ],
      ];
    }
    case 'ground': {
      const a = service.attributes;
      return [
        ['Modalidad', MODALITY_LABELS[a.modality]],
        ['Vehículo', labelOf(VEHICLE_KIND_LABELS, a.vehicle_kind)],
        ['Origen', a.origin],
        [
          'Capacidad máxima',
          a.max_capacity && count(a.max_capacity, 'persona', 'personas'),
        ],
      ];
    }
    case 'tours': {
      const a = service.attributes;
      const [one, many] =
        a.duration_unit === 'days' ? ['día', 'días'] : ['hora', 'horas'];
      return [
        ['Duración', count(a.duration_value, one, many)],
        ['Modalidad', labelOf(MODALITY_LABELS, a.modality)],
        ['Punto de encuentro', a.meeting_point],
        ['Incluye', includes(TOURS_INCLUDE_LABELS, a.includes)],
      ];
    }
    case 'cruise': {
      const a = service.attributes;
      return [
        ['Barco', a.ship_name],
        ['Puerto de salida', a.departure_port],
        ['Noches', count(a.nights, 'noche', 'noches')],
        ['Tipo de cabina', labelOf(CABIN_KIND_LABELS, a.cabin_kind)],
        ['Itinerario', a.itinerary],
        ['Incluye', includes(CRUISE_INCLUDE_LABELS, a.includes)],
      ];
    }
    case 'food': {
      const a = service.attributes;
      return [
        ['Comidas', includes(MEAL_LABELS, a.meals)],
        ['Servicio', labelOf(SERVICE_STYLE_LABELS, a.service_style)],
        ['Tipo de cocina', a.cuisine],
      ];
    }
    case 'wholesaler': {
      const a = service.attributes;
      return [
        [
          'Noches',
          a.nights === 0 ? 'Pasadía' : count(a.nights, 'noche', 'noches'),
        ],
        ['Ciudad de salida', a.departure_city],
        ['Incluye', includes(WHOLESALER_INCLUDE_LABELS, a.includes)],
      ];
    }
    case 'other':
      return [];
  }
}

export const attributeDetails = (
  service: TypedTouristService,
): AttributeDetail[] =>
  detailsOf(service)
    .filter(
      ([, value]) => value !== null && value !== undefined && value !== '',
    )
    .map(([term, value]) => ({ term, value }));

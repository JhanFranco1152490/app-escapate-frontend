import type { components } from '@/lib/api/schema';

type Schemas = components['schemas'];

// Las opciones fijas de cada tipo de servicio con su etiqueta. El orden de cada lista es el de
// la API: así se muestran y así se envían las casillas marcadas.
export const LODGING_KIND_LABELS: Record<Schemas['LodgingKind'], string> = {
  hotel: 'Hotel',
  resort: 'Resort',
  hostel: 'Hostal',
  apartment: 'Apartamento',
  cabin: 'Cabaña o finca',
  other: 'Otro',
};

export const MEAL_PLAN_LABELS: Record<Schemas['MealPlan'], string> = {
  room_only: 'Solo alojamiento',
  breakfast: 'Con desayuno',
  half_board: 'Media pensión',
  full_board: 'Pensión completa',
  all_inclusive: 'Todo incluido',
};

export const LODGING_INCLUDE_LABELS: Record<Schemas['LodgingInclude'], string> =
  {
    airport_transfers: 'Traslados aeropuerto',
    recreational_activities: 'Actividades recreativas',
    wifi: 'Wifi',
    parking: 'Parqueadero',
  };

export const TRIP_TYPE_LABELS: Record<Schemas['TripType'], string> = {
  one_way: 'Solo ida',
  round_trip: 'Ida y vuelta',
};

export const CABIN_CLASS_LABELS: Record<Schemas['CabinClass'], string> = {
  economy: 'Económica',
  premium_economy: 'Económica premium',
  business: 'Ejecutiva',
  first: 'Primera clase',
};

export const MODALITY_LABELS: Record<Schemas['Modality'], string> = {
  private: 'Privado',
  shared: 'Compartido',
};

export const VEHICLE_KIND_LABELS: Record<Schemas['VehicleKind'], string> = {
  car: 'Automóvil',
  van: 'Camioneta',
  minibus: 'Buseta',
  bus: 'Bus',
  other: 'Otro',
};

export const DURATION_UNIT_LABELS: Record<Schemas['DurationUnit'], string> = {
  hours: 'Horas',
  days: 'Días',
};

export const TOURS_INCLUDE_LABELS: Record<Schemas['ToursInclude'], string> = {
  transport: 'Transporte',
  guide: 'Guía',
  entrance_fees: 'Entradas',
  meals: 'Alimentación',
  insurance: 'Seguro',
};

export const CABIN_KIND_LABELS: Record<Schemas['CabinKind'], string> = {
  inside: 'Interior',
  ocean_view: 'Exterior',
  balcony: 'Balcón',
  suite: 'Suite',
};

export const CRUISE_INCLUDE_LABELS: Record<Schemas['CruiseInclude'], string> = {
  meals: 'Alimentación',
  drinks_package: 'Paquete de bebidas',
  port_fees: 'Tasas portuarias',
  gratuities: 'Propinas',
  excursions: 'Excursiones',
};

export const MEAL_LABELS: Record<Schemas['Meal'], string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
};

export const SERVICE_STYLE_LABELS: Record<Schemas['ServiceStyle'], string> = {
  buffet: 'Bufé',
  set_menu: 'Menú fijo',
  a_la_carte: 'A la carta',
};

export const WHOLESALER_INCLUDE_LABELS: Record<
  Schemas['WholesalerInclude'],
  string
> = {
  flights: 'Vuelos',
  lodging: 'Alojamiento',
  transfers: 'Traslados',
  tours: 'Tours',
  meals: 'Alimentación',
  travel_insurance: 'Asistencia de viaje',
};

// Las opciones de un select o de un grupo de casillas, en el orden de su lista.
export const optionsOf = <T extends string>(labels: Record<T, string>) =>
  (Object.keys(labels) as T[]).map((value) => ({
    value,
    label: labels[value],
  }));

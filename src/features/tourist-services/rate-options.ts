import type { StatusTone } from '@/components/status-badge';
import type { Currency } from '@/lib/validation/amount';

import type { ServiceType } from './api';
import type { ChargeUnit, RateValidity } from './rate-api';

// Sobre qué se cobra una tarifa, según el tipo de servicio: dice si al usarla hay que
// multiplicar por noches, por personas o por nada. La primera de cada tipo viene elegida.
// Es la misma tabla de la API, que rechaza una unidad que no sea de su tipo.
export const CHARGE_UNITS: Record<ServiceType, readonly ChargeUnit[]> = {
  lodging: ['per_night', 'per_person_per_night'],
  air: ['per_person'],
  ground: ['per_trip', 'per_person', 'per_day'],
  tours: ['per_person', 'per_group'],
  cruise: ['per_person', 'per_cabin'],
  food: ['per_person'],
  wholesaler: ['per_person', 'per_package'],
  other: ['per_service', 'per_person', 'per_day'],
};

// En minúscula: se leen detrás del valor ("$ 710.000 por noche") y dentro de la etiqueta del
// campo ("Valor por noche (COP)").
export const CHARGE_UNIT_LABELS: Record<ChargeUnit, string> = {
  per_night: 'por noche',
  per_person_per_night: 'por persona por noche',
  per_person: 'por persona',
  per_trip: 'por trayecto',
  per_day: 'por día',
  per_group: 'por grupo',
  per_cabin: 'por cabina',
  per_package: 'por paquete',
  per_service: 'por servicio',
};

export const CURRENCY_LABELS: Record<Currency, string> = {
  COP: 'Pesos colombianos (COP)',
  USD: 'Dólares (USD)',
};

// El estado se escribe además de mostrarse con color.
export const RATE_VALIDITY: Record<
  RateValidity,
  { label: string; tone: StatusTone }
> = {
  current: { label: 'Vigente', tone: 'ok' },
  upcoming: { label: 'Próxima', tone: 'pending' },
  expired: { label: 'Vencida', tone: 'inactive' },
};

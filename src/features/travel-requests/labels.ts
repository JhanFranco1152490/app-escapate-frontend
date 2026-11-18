import type { StatusTone } from '@/components/status-badge';

import type {
  AccommodationCategory,
  CloseReason,
  TravelRequestStatus,
  TravelType,
} from './api';

// Las listas van en el orden en que se ofrecen en el formulario y se muestran en la ficha.

export const STATUS_LABELS: Record<TravelRequestStatus, string> = {
  new: 'Nueva',
  quoting: 'En cotización',
  quoted: 'Cotizada',
  closed: 'Cerrada',
};

// Nueva y En cotización esperan a la agencia; Cotizada ya tiene propuesta.
export const STATUS_TONES: Record<TravelRequestStatus, StatusTone> = {
  new: 'pending',
  quoting: 'pending',
  quoted: 'ok',
  closed: 'inactive',
};

export const TRAVEL_TYPE_LABELS: Record<TravelType, string> = {
  leisure: 'Vacacional',
  family: 'Familiar',
  honeymoon: 'Luna de miel',
  corporate: 'Corporativo',
  group: 'Grupo',
  adventure: 'Aventura',
  other: 'Otro',
};

export const TRAVEL_TYPES = Object.keys(TRAVEL_TYPE_LABELS) as TravelType[];

export const ACCOMMODATION_LABELS: Record<AccommodationCategory, string> = {
  budget: 'Económico',
  three_star: '3 estrellas',
  four_star: '4 estrellas',
  five_star: '5 estrellas',
};

export const ACCOMMODATION_CATEGORIES = Object.keys(
  ACCOMMODATION_LABELS,
) as AccommodationCategory[];

export const CLOSE_REASON_LABELS: Record<CloseReason, string> = {
  client_declined: 'El cliente desistió',
  no_response: 'El cliente no respondió',
  bought_elsewhere: 'Compró con otra agencia',
  duplicate: 'Solicitud repetida',
  other: 'Otro',
};

export const CLOSE_REASONS = Object.keys(CLOSE_REASON_LABELS) as CloseReason[];

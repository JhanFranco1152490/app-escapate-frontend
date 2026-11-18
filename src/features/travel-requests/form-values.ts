import { formatAmountInput } from '@/lib/format/money';

import type { TravelRequestDetail } from './api';
import type { RequestFormValues } from './schemas';

type StartingPoint = {
  // El cliente ya elegido (llega desde su ficha o recién registrado), si lo hay.
  client: { id: number; name: string } | null;
  // Quien está en la sesión: es el responsable salvo que se elija otro.
  advisorId: number;
};

// Una solicitud nueva: fechas exactas, un adulto y sin menores.
export function emptyRequestForm({
  client,
  advisorId,
}: StartingPoint): RequestFormValues {
  return {
    client_id: client?.id ?? null,
    client_name: client?.name ?? '',
    destination: '',
    origin: '',
    date_mode: 'exact',
    departure_date: '',
    return_date: '',
    window_start: '',
    window_end: '',
    approx_nights: '',
    adults: '1',
    minors: '0',
    budget_min: '',
    budget_max: '',
    trip_types: [],
    accommodation_category: '',
    assigned_to_id: String(advisorId),
    notes: '',
  };
}

const budgetText = (value: number | null) =>
  value === null ? '' : formatAmountInput(String(value), 'COP');

// La solicitud guardada, como la muestran los campos del formulario de edición.
export function requestFormValues(
  request: TravelRequestDetail,
): RequestFormValues {
  return {
    client_id: request.client.id,
    client_name: request.client.display_name,
    destination: request.destination,
    origin: request.origin ?? '',
    date_mode: request.date_mode,
    departure_date: request.departure_date ?? '',
    return_date: request.return_date ?? '',
    window_start: request.window_start ?? '',
    window_end: request.window_end ?? '',
    approx_nights: request.approx_nights?.toString() ?? '',
    adults: String(request.adults),
    minors: String(request.minors),
    budget_min: budgetText(request.budget_min),
    budget_max: budgetText(request.budget_max),
    trip_types: request.trip_types,
    accommodation_category: request.accommodation_category ?? '',
    assigned_to_id: String(request.assigned_to.id),
    notes: request.notes ?? '',
  };
}

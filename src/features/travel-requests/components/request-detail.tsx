import { DetailItem } from '@/components/detail-item';

import type { TravelRequestDetail } from '../api';
import { formatBudget, formatTravelers, formatTripDates } from '../format';
import { ACCOMMODATION_LABELS, TRAVEL_TYPE_LABELS } from '../labels';

const NOT_GIVEN = '—';
const NO_PREFERENCE = 'Sin preferencia';

const sectionClass = 'rounded-md border bg-card';
const titleClass = 'border-b px-5 py-4 font-heading text-lg font-semibold';

// Todo lo que se registró de la solicitud. Solo esta: aunque el cliente tenga otras, la ficha
// no las mezcla.
export function RequestDetail({ request }: { request: TravelRequestDetail }) {
  const travelTypes = request.trip_types
    .map((type) => TRAVEL_TYPE_LABELS[type])
    .join(', ');

  return (
    <section aria-labelledby="request-data-title" className={sectionClass}>
      <h2 id="request-data-title" className={titleClass}>
        Datos de la solicitud
      </h2>
      <dl className="grid gap-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
        <DetailItem term="Destino">{request.destination}</DetailItem>
        <DetailItem term="Origen">{request.origin ?? NOT_GIVEN}</DetailItem>
        <DetailItem term="Fechas">{formatTripDates(request)}</DetailItem>
        <DetailItem term="Viajeros">
          {formatTravelers(request.adults, request.minors)}
        </DetailItem>
        <DetailItem term="Presupuesto">
          {formatBudget(request.budget_min, request.budget_max)}
        </DetailItem>
        <DetailItem term="Tipos de viaje">
          {travelTypes || NO_PREFERENCE}
        </DetailItem>
        <DetailItem term="Alojamiento">
          {request.accommodation_category
            ? ACCOMMODATION_LABELS[request.accommodation_category]
            : NO_PREFERENCE}
        </DetailItem>
        <DetailItem
          term="Condiciones y observaciones"
          className="sm:col-span-2 lg:col-span-3"
        >
          <span className="whitespace-pre-line">
            {request.notes ?? NOT_GIVEN}
          </span>
        </DetailItem>
      </dl>
    </section>
  );
}

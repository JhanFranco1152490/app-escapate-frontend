import { DetailItem } from '@/components/detail-item';
import { formatDateTime } from '@/lib/format/dates';

import type { TravelRequestDetail } from '../api';
import { CLOSE_REASON_LABELS } from '../labels';
import { RequestStatusBadge } from './request-status-badge';

const sectionClass = 'rounded-md border bg-card';
const titleClass = 'border-b px-5 py-4 font-heading text-lg font-semibold';

// En qué va la atención: estado, quién la tiene a cargo y, si se cerró, por qué.
export function RequestProcess({ request }: { request: TravelRequestDetail }) {
  const advisor = request.assigned_to;
  const closed = request.status === 'closed';

  return (
    <section aria-labelledby="request-process-title" className={sectionClass}>
      <h2 id="request-process-title" className={titleClass}>
        Proceso
      </h2>
      <dl className="grid gap-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
        <DetailItem term="Estado">
          <RequestStatusBadge status={request.status} />
        </DetailItem>
        <DetailItem term="Asesor responsable">
          {advisor.is_active
            ? advisor.full_name
            : `${advisor.full_name} (inactivo)`}
        </DetailItem>
        <DetailItem term="Última modificación">
          {formatDateTime(request.updated_at)}
        </DetailItem>
        {closed && request.close_reason && (
          <>
            <DetailItem term="Motivo de cierre">
              {CLOSE_REASON_LABELS[request.close_reason]}
            </DetailItem>
            <DetailItem term="Nota de cierre">
              {request.close_note ?? '—'}
            </DetailItem>
            {request.closed_by && request.closed_at && (
              <DetailItem term="Cerrada">
                Por {request.closed_by.full_name} el{' '}
                {formatDateTime(request.closed_at)}
              </DetailItem>
            )}
          </>
        )}
      </dl>
    </section>
  );
}

'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Alert } from '@/components/alert';
import { PageHeader } from '@/components/page-header';
import { useHasPermission } from '@/features/auth/permissions';
import type { ActionFeedback } from '@/lib/action-feedback';
import { formatDay } from '@/lib/format/dates';
import { parseRouteId } from '@/lib/route-id';
import { usePageNotice } from '@/lib/use-page-notice';

import type { TravelRequestDetail } from '../api';
import { formatTripDates } from '../format';
import { requestNoticeTarget } from '../request-notice';
import { RequestActions } from './request-actions';
import { RequestDetail } from './request-detail';
import { RequestLoader } from './request-loader';
import { RequestProcess } from './request-process';
import { RequestStatusBadge } from './request-status-badge';

// Debajo del título: adónde y cuándo, de quién es y quién la registró.
function RequestSummaryLine({ request }: { request: TravelRequestDetail }) {
  const canViewClients = useHasPermission('clients.view');
  const client = request.client;
  return (
    <>
      <span className="block">
        {request.destination} · {formatTripDates(request)}
      </span>
      <span className="block">
        {canViewClients ? (
          <Link
            href={`/clientes/${client.id}`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {client.display_name}
          </Link>
        ) : (
          <span className="font-medium text-foreground">
            {client.display_name}
          </span>
        )}
        {` · Creada el ${formatDay(request.created_at)} por ${request.created_by.full_name}`}
      </span>
    </>
  );
}

export function RequestDetailScreen({ id }: { id: string }) {
  const requestId = parseRouteId(id);
  const canManage = useHasPermission('travel_requests.manage');
  // "Solicitud registrada." o "Cambios guardados.", si se llega desde el formulario.
  const pageNotice = usePageNotice(requestNoticeTarget(requestId ?? 0));
  const [feedback, setFeedback] = useState<ActionFeedback>();

  return (
    <RequestLoader
      requestId={requestId}
      back={{ href: '/solicitudes', label: 'Solicitudes' }}
    >
      {(request) => (
        <>
          <PageHeader
            eyebrow="Operación / 04"
            title={`Solicitud ${request.code}`}
            description={<RequestSummaryLine request={request} />}
            actions={
              canManage && (
                <RequestActions request={request} onDone={setFeedback} />
              )
            }
          />
          <div>
            <RequestStatusBadge status={request.status} />
          </div>
          {feedback ? (
            <Alert variant={feedback.variant} title={feedback.text} />
          ) : (
            pageNotice && <Alert variant="info" title={pageNotice} />
          )}
          <RequestDetail request={request} />
          <RequestProcess request={request} />
        </>
      )}
    </RequestLoader>
  );
}

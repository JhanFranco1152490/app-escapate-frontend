'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Alert } from '@/components/alert';
import { PageHeader } from '@/components/page-header';
import { useHasPermission } from '@/features/auth/permissions';
import { QuoteSaleBox } from '@/features/sales/components/quote-sale-box';
import type { ActionFeedback } from '@/lib/action-feedback';
import { formatDay } from '@/lib/format/dates';
import { parseRouteId } from '@/lib/route-id';
import { usePageNotice } from '@/lib/use-page-notice';

import type { QuoteDetail } from '../api';
import { quoteNoticeTarget } from '../format';
import { QuoteActions } from './quote-actions';
import { QuoteConditionsDetail } from './quote-conditions-detail';
import { QuoteFollowUpsSection } from './quote-follow-ups-section';
import { QuoteGeneralDetail } from './quote-general-detail';
import { QuoteItemsSection } from './quote-items-section';
import { QuoteLoader } from './quote-loader';
import { QuotePricingSection } from './quote-pricing-section';
import { QuoteStatusBadge } from './quote-status-badge';

const linkClass =
  'font-medium text-foreground underline-offset-4 hover:underline';

// Debajo del título: de quién es, de qué solicitud sale y quién la creó.
function QuoteSummaryLine({ quote }: { quote: QuoteDetail }) {
  const canViewClients = useHasPermission('clients.view');
  const canViewRequests = useHasPermission('travel_requests.view');
  return (
    <>
      <span className="block">
        {canViewClients ? (
          <Link href={`/clientes/${quote.client.id}`} className={linkClass}>
            {quote.client.display_name}
          </Link>
        ) : (
          <span className="font-medium text-foreground">
            {quote.client.display_name}
          </span>
        )}
        {' · Solicitud '}
        {canViewRequests ? (
          <Link
            href={`/solicitudes/${quote.travel_request.id}`}
            className={linkClass}
          >
            {quote.travel_request.code}
          </Link>
        ) : (
          quote.travel_request.code
        )}
      </span>
      <span className="block">
        {quote.revision > 1 && `Versión ${quote.revision} · `}
        Creada el {formatDay(quote.created_at)} por {quote.created_by.full_name}
      </span>
    </>
  );
}

export function QuoteDetailScreen({ id }: { id: string }) {
  const quoteId = parseRouteId(id);
  const canManage = useHasPermission('quotes.manage');
  const pageNotice = usePageNotice(quoteNoticeTarget(quoteId ?? 0));
  const [feedback, setFeedback] = useState<ActionFeedback>();

  return (
    <QuoteLoader
      quoteId={quoteId}
      back={{ href: '/cotizaciones', label: 'Cotizaciones' }}
    >
      {(quote) => (
        <>
          <PageHeader
            eyebrow="Operación / 06"
            title={`Cotización ${quote.code}`}
            description={<QuoteSummaryLine quote={quote} />}
            actions={
              canManage && <QuoteActions quote={quote} onDone={setFeedback} />
            }
          />
          <div>
            <QuoteStatusBadge quote={quote} />
          </div>
          {feedback ? (
            <Alert variant={feedback.variant} title={feedback.text} />
          ) : (
            pageNotice && <Alert variant="info" title={pageNotice} />
          )}
          {quote.is_expired && (
            <Alert title="La vigencia de esta cotización ya pasó.">
              <p>
                Para que el cliente la acepte, vuélvela a borrador y actualiza
                la vigencia y los precios.
              </p>
            </Alert>
          )}
          {quote.status === 'accepted' && <QuoteSaleBox quoteId={quote.id} />}
          <QuoteGeneralDetail quote={quote} />
          <QuoteItemsSection quote={quote} />
          <QuotePricingSection quote={quote} />
          <QuoteConditionsDetail quote={quote} />
          <QuoteFollowUpsSection quote={quote} />
        </>
      )}
    </QuoteLoader>
  );
}

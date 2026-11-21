'use client';

import { Copy, GitBranch } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { actionErrorMessage, type ActionFeedback } from '@/lib/action-feedback';
import { setPageNotice } from '@/lib/page-notice';

import type { QuoteDetail } from '../api';
import { quoteNoticeTarget } from '../format';
import { useCopyQuote } from '../mutations';

// Versión nueva: corregir una propuesta ya enviada sin perder la original. Duplicar: partir
// de esta para otra propuesta de la misma solicitud.
export function CopyQuoteButtons({
  quote,
  onError,
}: {
  quote: QuoteDetail;
  onError: (feedback: ActionFeedback) => void;
}) {
  const router = useRouter();
  const copy = useCopyQuote(quote.id);
  const run = (asNewVersion: boolean) =>
    copy.mutate(asNewVersion, {
      onSuccess: (created) => {
        setPageNotice({
          target: quoteNoticeTarget(created.id),
          text: asNewVersion
            ? `Versión ${created.revision} creada a partir de ${quote.code}.`
            : `Copia de ${quote.code} creada como borrador.`,
        });
        router.push(`/cotizaciones/${created.id}`);
      },
      onError: (error) =>
        onError({ variant: 'error', text: actionErrorMessage(error) }),
    });

  return (
    <>
      {(quote.status === 'sent' || quote.status === 'rejected') && (
        <Button
          variant="outline"
          disabled={copy.isPending}
          onClick={() => run(true)}
        >
          <GitBranch aria-hidden="true" />
          Nueva versión
        </Button>
      )}
      <Button
        variant="outline"
        disabled={copy.isPending}
        onClick={() => run(false)}
      >
        <Copy aria-hidden="true" />
        Duplicar
      </Button>
    </>
  );
}

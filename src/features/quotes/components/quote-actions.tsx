'use client';

import { FileText, Pencil } from 'lucide-react';
import { useState } from 'react';

import { ButtonLink } from '@/components/button-link';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { actionErrorMessage, type ActionFeedback } from '@/lib/action-feedback';

import type { QuoteDetail } from '../api';
import { useQuoteTransition, type QuoteTransition } from '../mutations';
import { CopyQuoteButtons } from './copy-quote-buttons';

type Step = {
  action: QuoteTransition;
  label: string;
  done: string;
  variant?: 'outline' | 'destructive';
  // Lo que no se puede deshacer pide confirmación.
  confirm?: { title: string; description: string };
};

const SEND: Step = {
  action: 'send',
  label: 'Marcar como enviada',
  done: 'Cotización enviada. Ya no se puede editar.',
};
const TO_DRAFT: Step = {
  action: 'return-to-draft',
  label: 'Volver a borrador',
  done: 'La cotización volvió a borrador.',
  variant: 'outline',
};
const ACCEPT: Step = {
  action: 'accept',
  label: 'El cliente aceptó',
  done: 'Cotización aceptada.',
  confirm: {
    title: '¿El cliente aceptó la cotización?',
    description:
      'Una cotización aceptada ya no vuelve a borrador: desde ella se registra la venta.',
  },
};
const REJECT: Step = {
  action: 'reject',
  label: 'El cliente rechazó',
  done: 'Cotización rechazada.',
  variant: 'destructive',
};

const STEPS: Record<QuoteDetail['status'], Step[]> = {
  draft: [SEND],
  sent: [TO_DRAFT, REJECT, ACCEPT],
  rejected: [TO_DRAFT],
  accepted: [],
};

type QuoteActionsProps = {
  quote: QuoteDetail;
  onDone: (feedback: ActionFeedback) => void;
};

// Lo que se puede hacer según el estado. Todas van con la versión de la ficha que se mira.
export function QuoteActions({ quote, onDone }: QuoteActionsProps) {
  const transition = useQuoteTransition(quote.id);
  const [confirming, setConfirming] = useState<Step>();

  const run = (step: Step) =>
    transition.mutate(
      { action: step.action, version: quote.version },
      {
        onSuccess: () => {
          setConfirming(undefined);
          onDone({ variant: 'info', text: step.done });
        },
        onError: (error) => {
          if (step.confirm) return;
          onDone({ variant: 'error', text: actionErrorMessage(error) });
        },
      },
    );

  const start = (step: Step) => {
    transition.reset();
    if (step.confirm) setConfirming(step);
    else run(step);
  };

  return (
    <>
      <ButtonLink
        href={`/cotizaciones/${quote.id}/documento`}
        variant="outline"
      >
        <FileText aria-hidden="true" />
        Documento
      </ButtonLink>
      <CopyQuoteButtons quote={quote} onError={onDone} />
      {quote.status === 'draft' && (
        <>
          <ButtonLink
            href={`/cotizaciones/${quote.id}/editar`}
            variant="outline"
          >
            <Pencil aria-hidden="true" />
            Datos generales
          </ButtonLink>
          <ButtonLink
            href={`/cotizaciones/${quote.id}/condiciones`}
            variant="outline"
          >
            Condiciones
          </ButtonLink>
        </>
      )}
      {STEPS[quote.status].map((step) => (
        <Button
          key={step.action}
          variant={step.variant}
          disabled={transition.isPending}
          onClick={() => start(step)}
        >
          {step.label}
        </Button>
      ))}
      {confirming?.confirm && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setConfirming(undefined)}
          title={confirming.confirm.title}
          description={confirming.confirm.description}
          confirmLabel={confirming.label}
          pending={transition.isPending}
          error={
            transition.isError
              ? actionErrorMessage(transition.error)
              : undefined
          }
          onConfirm={() => run(confirming)}
        />
      )}
    </>
  );
}

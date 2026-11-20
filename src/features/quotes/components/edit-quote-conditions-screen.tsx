'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { FormSection } from '@/components/form-section';

import type { QuoteDetail } from '../api';
import { conditionsFormValues } from '../form-values';
import { useUpdateQuoteConditions } from '../mutations';
import {
  conditionsSchema,
  type ConditionsFormValues,
  type ConditionsPayload,
} from '../schemas';
import { QuoteEditFrame } from './quote-edit-frame';
import { QuoteFormShell } from './quote-form-shell';
import { TextInputField } from './text-input-field';

const FIELDS = [
  'deposit_percent',
  'balance_due_date',
  'payment_terms',
  'policies',
] as const;

function ConditionsForm({
  quote,
  save,
  notices,
}: {
  quote: QuoteDetail;
  save: (send: (version: number) => Promise<unknown>) => Promise<void>;
  notices: React.ReactNode;
}) {
  const update = useUpdateQuoteConditions(quote.id);
  const form = useForm<ConditionsFormValues, unknown, ConditionsPayload>({
    resolver: zodResolver(conditionsSchema),
    defaultValues: conditionsFormValues(quote),
  });
  return (
    <QuoteFormShell
      form={form}
      fields={FIELDS}
      subject="las condiciones"
      cancelHref={`/cotizaciones/${quote.id}`}
      notices={notices}
      onSubmit={(payload) =>
        save((version) =>
          update.mutateAsync({ ...payload, expected_version: version }),
        )
      }
    >
      <FormSection title="Pagos">
        <TextInputField
          form={form}
          name="deposit_percent"
          label="% de abono para reservar"
          inputMode="decimal"
          hint="Del precio total: 30 o 50."
        />
        <TextInputField
          form={form}
          name="balance_due_date"
          label="Fecha límite del saldo"
          type="date"
        />
        <TextInputField
          form={form}
          name="payment_terms"
          label="Forma de pago"
          multiline
          maxLength={4000}
        />
      </FormSection>
      <FormSection title="Políticas">
        <TextInputField
          form={form}
          name="policies"
          label="Políticas y restricciones"
          multiline
          maxLength={4000}
          hint="Cancelación, cambios, documentos de viaje, disponibilidad…"
        />
      </FormSection>
    </QuoteFormShell>
  );
}

export function EditQuoteConditionsScreen({ id }: { id: string }) {
  return (
    <QuoteEditFrame
      id={id}
      title="Condiciones comerciales"
      render={({ quote, save, notices }) => (
        <ConditionsForm
          key={quote.version}
          quote={quote}
          save={save}
          notices={notices}
        />
      )}
    />
  );
}

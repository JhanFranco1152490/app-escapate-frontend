'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { FormSection } from '@/components/form-section';

import { generalFormValues } from '../form-values';
import { useUpdateQuoteGeneral } from '../mutations';
import {
  generalSchema,
  type GeneralFormValues,
  type GeneralPayload,
} from '../schemas';
import type { QuoteDetail } from '../api';
import { QuoteEditFrame } from './quote-edit-frame';
import { QuoteFormShell } from './quote-form-shell';
import { TextInputField } from './text-input-field';

const FIELDS = [
  'destination',
  'origin',
  'departure_date',
  'return_date',
  'adults',
  'minors',
  'valid_until',
  'notes',
] as const;

function GeneralForm({
  quote,
  save,
  notices,
}: {
  quote: QuoteDetail;
  save: (send: (version: number) => Promise<unknown>) => Promise<void>;
  notices: React.ReactNode;
}) {
  const update = useUpdateQuoteGeneral(quote.id);
  const form = useForm<GeneralFormValues, unknown, GeneralPayload>({
    resolver: zodResolver(generalSchema),
    defaultValues: generalFormValues(quote),
  });
  return (
    <QuoteFormShell
      form={form}
      fields={FIELDS}
      subject="la cotización"
      cancelHref={`/cotizaciones/${quote.id}`}
      notices={notices}
      onSubmit={(payload) =>
        save((version) =>
          update.mutateAsync({ ...payload, expected_version: version }),
        )
      }
    >
      <FormSection title="Viaje" required>
        <TextInputField
          form={form}
          name="destination"
          label="Destino"
          required
          maxLength={150}
        />
        <TextInputField
          form={form}
          name="origin"
          label="Origen"
          maxLength={120}
        />
        <TextInputField
          form={form}
          name="departure_date"
          label="Salida"
          type="date"
        />
        <TextInputField
          form={form}
          name="return_date"
          label="Regreso"
          type="date"
        />
        <TextInputField
          form={form}
          name="adults"
          label="Adultos"
          required
          inputMode="numeric"
        />
        <TextInputField
          form={form}
          name="minors"
          label="Menores"
          required
          inputMode="numeric"
        />
      </FormSection>
      <FormSection title="Propuesta">
        <TextInputField
          form={form}
          name="valid_until"
          label="Vigente hasta"
          required
          type="date"
          hint="Después de esta fecha los precios ya no se garantizan."
        />
        <TextInputField
          form={form}
          name="notes"
          label="Notas internas"
          multiline
          maxLength={4000}
          hint="No salen en el documento que recibe el cliente."
        />
      </FormSection>
    </QuoteFormShell>
  );
}

export function EditQuoteGeneralScreen({ id }: { id: string }) {
  return (
    <QuoteEditFrame
      id={id}
      title="Datos generales"
      render={({ quote, save, notices }) => (
        // La clave cambia con la versión: al recargar, el formulario se arma con lo guardado.
        <GeneralForm
          key={quote.version}
          quote={quote}
          save={save}
          notices={notices}
        />
      )}
    />
  );
}

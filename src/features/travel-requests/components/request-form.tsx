'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';

import { Alert } from '@/components/alert';
import { ButtonLink } from '@/components/button-link';
import { FormSection } from '@/components/form-section';
import { Button } from '@/components/ui/button';
import { rateLimitOr } from '@/lib/api/errors';
import { applyApiFormError } from '@/lib/api/form-errors';
import {
  SERVER_FIELDS_NOTICE,
  invalidFormNotice,
  type FormNotice,
} from '@/lib/form-notice';
import { useUnsavedChangesWarning } from '@/lib/use-unsaved-changes-warning';

import { useAdvisors } from '../api';
import type { OriginalDates } from '../date-rules';
import {
  REQUEST_MISSING_MESSAGES,
  travelRequestSchema,
  type RequestFormValues,
  type RequestPayload,
} from '../schemas';
import { AdvisorField } from './advisor-field';
import { DestinationFields } from './destination-fields';
import { PreferencesFields } from './preferences-fields';
import { RequestClientField } from './request-client-field';
import { TravelersBudgetFields } from './travelers-budget-fields';
import { TripDatesFields } from './trip-dates-fields';

// Los campos del formulario que también nombra la API en sus errores.
const FIELDS = [
  'client_id',
  'destination',
  'origin',
  'date_mode',
  'departure_date',
  'return_date',
  'window_start',
  'window_end',
  'approx_nights',
  'adults',
  'minors',
  'budget_min',
  'budget_max',
  'trip_types',
  'accommodation_category',
  'assigned_to_id',
  'notes',
] as const;

const GENERIC_SAVE_ERROR =
  'No pudimos guardar la solicitud. Inténtalo de nuevo.';

type RequestFormProps = {
  mode: 'create' | 'edit';
  defaultValues: RequestFormValues;
  // Solo en la edición: las fechas guardadas y el responsable actual.
  original?: OriginalDates;
  currentAdvisor?: { id: number; full_name: string };
  submitLabel: string;
  cancelHref: string;
  onSubmit: (payload: RequestPayload) => Promise<unknown>;
  // Avisos que no son de validación y van arriba de los campos.
  notices?: ReactNode;
};

export function RequestForm({
  mode,
  defaultValues,
  original,
  currentAdvisor,
  submitLabel,
  cancelHref,
  onSubmit,
  notices,
}: RequestFormProps) {
  const [notice, setNotice] = useState<FormNotice>();
  const advisors = useAdvisors();
  const advisorIds = useMemo(
    () => advisors.data?.map(({ id }) => id),
    [advisors.data],
  );
  const form = useForm<RequestFormValues, unknown, RequestPayload>({
    resolver: zodResolver(travelRequestSchema({ original, advisorIds })),
    defaultValues,
  });
  const {
    handleSubmit,
    setError,
    setFocus,
    formState: { isSubmitting, isDirty },
  } = form;
  useUnsavedChangesWarning(isDirty);

  const submit = handleSubmit(
    async (payload) => {
      setNotice(undefined);
      try {
        await onSubmit(payload);
      } catch (error) {
        const { needsNotice, firstInvalid } = applyApiFormError(
          error,
          setError,
          FIELDS,
        );
        setNotice(
          needsNotice
            ? { title: rateLimitOr(error, GENERIC_SAVE_ERROR) }
            : SERVER_FIELDS_NOTICE,
        );
        if (firstInvalid) setFocus(firstInvalid);
      }
    },
    (invalid) =>
      setNotice(
        invalidFormNotice(invalid, {
          subject: 'la solicitud',
          requiredMessages: REQUEST_MISSING_MESSAGES,
        }),
      ),
  );

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
      {notice && (
        <Alert title={notice.title}>
          {notice.body && <p>{notice.body}</p>}
        </Alert>
      )}
      {notices}
      <FormSection title="Cliente y destino" required>
        <RequestClientField form={form} fixed={mode === 'edit'} />
        <DestinationFields form={form} />
      </FormSection>
      <FormSection title="Fechas del viaje">
        <TripDatesFields form={form} />
      </FormSection>
      <FormSection title="Viajeros y presupuesto">
        <TravelersBudgetFields form={form} />
      </FormSection>
      <FormSection title="Preferencias">
        <PreferencesFields form={form} />
      </FormSection>
      <FormSection title="Responsable">
        <AdvisorField
          form={form}
          advisors={advisors.data}
          current={currentAdvisor}
        />
      </FormSection>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <ButtonLink href={cancelHref} variant="outline">
          Cancelar
        </ButtonLink>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

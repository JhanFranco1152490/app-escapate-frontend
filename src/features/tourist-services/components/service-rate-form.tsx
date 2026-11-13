'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';

import { Alert } from '@/components/alert';
import { Button } from '@/components/ui/button';
import { rateLimitOr } from '@/lib/api/errors';
import { applyApiFormError } from '@/lib/api/form-errors';
import {
  SERVER_FIELDS_NOTICE,
  invalidFormNotice,
  type FormNotice,
} from '@/lib/form-notice';

import type { ServiceType } from '../api';
import {
  RATE_MISSING_MESSAGES,
  rateFormSchema,
  type RateFormValues,
  type RatePayload,
} from '../rate-schemas';
import { RateFields } from './rate-fields';

// Los campos del formulario que también nombra la API en sus errores.
const FIELDS = [
  'name',
  'valid_from',
  'valid_until',
  'currency',
  'charge_unit',
  'amount',
  'conditions',
] as const;

const GENERIC_SAVE_ERROR = 'No pudimos guardar la tarifa. Inténtalo de nuevo.';

type ServiceRateFormProps = {
  serviceType: ServiceType;
  defaultValues: RateFormValues;
  onSubmit: (payload: RatePayload) => Promise<unknown>;
  onCancel: () => void;
  // Avisos que no son de validación y van arriba de los campos.
  notices?: ReactNode;
};

export function ServiceRateForm({
  serviceType,
  defaultValues,
  onSubmit,
  onCancel,
  notices,
}: ServiceRateFormProps) {
  const [notice, setNotice] = useState<FormNotice>();
  const schema = useMemo(() => rateFormSchema(serviceType), [serviceType]);
  const form = useForm<RateFormValues, unknown, RatePayload>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const {
    handleSubmit,
    setError,
    setFocus,
    formState: { isSubmitting },
  } = form;

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
          subject: 'la tarifa',
          requiredMessages: RATE_MISSING_MESSAGES,
        }),
      ),
  );

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      {notice && (
        <Alert title={notice.title}>
          {notice.body && <p>{notice.body}</p>}
        </Alert>
      )}
      {notices}
      <RateFields form={form} serviceType={serviceType} />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : 'Guardar tarifa'}
        </Button>
      </div>
    </form>
  );
}

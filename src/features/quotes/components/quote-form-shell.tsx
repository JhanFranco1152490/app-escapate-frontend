'use client';

import { useState, type ReactNode } from 'react';
import type {
  FieldErrors,
  FieldValues,
  Path,
  UseFormReturn,
} from 'react-hook-form';

import { Alert } from '@/components/alert';
import { ButtonLink } from '@/components/button-link';
import { Button } from '@/components/ui/button';
import { rateLimitOr } from '@/lib/api/errors';
import { applyApiFormError } from '@/lib/api/form-errors';
import {
  SERVER_FIELDS_NOTICE,
  invalidFormNotice,
  type FormNotice,
} from '@/lib/form-notice';
import { useUnsavedChangesWarning } from '@/lib/use-unsaved-changes-warning';

type QuoteFormShellProps<Values extends FieldValues, Payload> = {
  form: UseFormReturn<Values, unknown, Payload>;
  // Los campos que también nombra la API en sus errores.
  fields: readonly Path<Values>[];
  subject: string;
  cancelHref: string;
  onSubmit: (payload: Payload) => Promise<unknown>;
  notices: ReactNode;
  children: ReactNode;
};

// Lo que comparten los formularios de una cotización: aviso de campos con error (propios o
// de la API), avisos de arriba, botones y la advertencia de cambios sin guardar.
export function QuoteFormShell<Values extends FieldValues, Payload>({
  form,
  fields,
  subject,
  cancelHref,
  onSubmit,
  notices,
  children,
}: QuoteFormShellProps<Values, Payload>) {
  const [notice, setNotice] = useState<FormNotice>();
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
          fields,
        );
        setNotice(
          needsNotice
            ? {
                title: rateLimitOr(
                  error,
                  `No pudimos guardar ${subject}. Inténtalo de nuevo.`,
                ),
              }
            : SERVER_FIELDS_NOTICE,
        );
        if (firstInvalid) setFocus(firstInvalid);
      }
    },
    (invalid: FieldErrors<Values>) =>
      setNotice(invalidFormNotice(invalid, { subject })),
  );

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
      {notice && (
        <Alert title={notice.title}>
          {notice.body && <p>{notice.body}</p>}
        </Alert>
      )}
      {notices}
      {children}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <ButtonLink href={cancelHref} variant="outline">
          Cancelar
        </ButtonLink>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}

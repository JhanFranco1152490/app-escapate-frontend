'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';

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

import {
  CONSENT_MESSAGE,
  THE_CLIENT_NEEDS_CLIENT_MESSAGE,
  travelerFormSchema,
  type TravelerFormValues,
  type TravelerPayload,
} from '../schemas';
import { ReferenceClientField } from './reference-client-field';
import { TravelerIdentityFields } from './traveler-identity-fields';
import { TravelerNotesFields } from './traveler-notes-fields';

// Los campos del formulario que también nombra la API en sus errores.
const FIELDS = [
  'first_name',
  'last_name',
  'document_type',
  'document_number',
  'birth_date',
  'nationality',
  'reference_client_id',
  'is_the_client',
  'notes',
  'data_consent',
] as const;

const GENERIC_SAVE_ERROR = 'No pudimos guardar el viajero. Inténtalo de nuevo.';

type TravelerFormProps = {
  mode: 'create' | 'edit';
  defaultValues: TravelerFormValues;
  submitLabel: string;
  cancelHref: string;
  onSubmit: (payload: TravelerPayload) => Promise<unknown>;
  // Avisos que no son de validación y van arriba de los campos.
  notices?: ReactNode;
};

export function TravelerForm({
  mode,
  defaultValues,
  submitLabel,
  cancelHref,
  onSubmit,
  notices,
}: TravelerFormProps) {
  const creating = mode === 'create';
  const [notice, setNotice] = useState<FormNotice>();
  const form = useForm<TravelerFormValues, unknown, TravelerPayload>({
    resolver: zodResolver(travelerFormSchema({ requireConsent: creating })),
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
        // El cliente de referencia no es un campo enfocable: su error queda a la vista.
        if (firstInvalid && firstInvalid !== 'reference_client_id')
          setFocus(firstInvalid);
      }
    },
    (invalid) =>
      setNotice(
        invalidFormNotice(invalid, {
          subject: 'el viajero',
          requiredMessages: [CONSENT_MESSAGE, THE_CLIENT_NEEDS_CLIENT_MESSAGE],
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
      <section className="rounded-md border bg-card">
        <header className="flex items-center justify-between gap-3 border-b px-5 py-4">
          <h2 className="font-heading text-lg font-semibold">
            Datos del viajero
          </h2>
          <span className="font-mono text-[0.625rem] tracking-[0.16em] text-muted-foreground uppercase">
            * Obligatorio
          </span>
        </header>
        <div className="grid gap-5 px-5 py-5 md:grid-cols-2">
          <TravelerIdentityFields form={form} />
          <ReferenceClientField form={form} />
          <TravelerNotesFields form={form} withConsent={creating} />
        </div>
        <footer className="flex flex-col-reverse gap-3 border-t px-5 py-4 sm:flex-row sm:justify-end">
          <ButtonLink href={cancelHref} variant="outline">
            Cancelar
          </ButtonLink>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : submitLabel}
          </Button>
        </footer>
      </section>
    </form>
  );
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';

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

import type { ClientType } from '../api';
import {
  CONSENT_MESSAGE,
  OTHER_DETAIL_MESSAGE,
  clientFormSchema,
  type ClientFormValues,
  type ClientPayload,
} from '../schemas';
import { ClientContactFields } from './client-contact-fields';
import { ClientIdentityFields } from './client-identity-fields';
import { ClientNotesFields } from './client-notes-fields';
import { ClientTypeField } from './client-type-field';

// Los campos del formulario que también nombra la API en sus errores.
const FIELDS = [
  'client_type',
  'first_name',
  'last_name',
  'business_name',
  'document_type',
  'document_number',
  'birth_date',
  'phone',
  'email',
  'city',
  'contact_source',
  'contact_source_detail',
  'notes',
  'data_consent',
] as const;

const GENERIC_SAVE_ERROR = 'No pudimos guardar el cliente. Inténtalo de nuevo.';

type ClientFormProps = {
  mode: 'create' | 'edit';
  defaultValues: ClientFormValues;
  submitLabel: string;
  cancelHref: string;
  onSubmit: (payload: ClientPayload) => Promise<unknown>;
  // Avisos que no son de validación y van arriba de los campos.
  notices?: ReactNode;
};

export function ClientForm({
  mode,
  defaultValues,
  submitLabel,
  cancelHref,
  onSubmit,
  notices,
}: ClientFormProps) {
  const creating = mode === 'create';
  const [notice, setNotice] = useState<FormNotice>();
  const form = useForm<ClientFormValues, unknown, ClientPayload>({
    resolver: zodResolver(clientFormSchema({ requireConsent: creating })),
    defaultValues,
  });
  const {
    control,
    handleSubmit,
    setError,
    setFocus,
    setValue,
    clearErrors,
    formState: { isSubmitting, isDirty },
  } = form;
  const [clientType, documentType, source] = useWatch({
    control,
    name: ['client_type', 'document_type', 'contact_source'],
  });
  useUnsavedChangesWarning(isDirty);

  // Cada tipo tiene sus propios campos y tipos de documento: los errores del otro tipo ya no
  // aplican.
  const changeType = (type: ClientType) => {
    setValue('client_type', type, { shouldDirty: true });
    setValue('document_type', type === 'company' ? 'NIT' : 'CC');
    clearErrors();
  };

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
          subject: 'el cliente',
          requiredMessages: [OTHER_DETAIL_MESSAGE, CONSENT_MESSAGE],
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
            Datos del cliente
          </h2>
          <span className="font-mono text-[0.625rem] tracking-[0.16em] text-muted-foreground uppercase">
            * Obligatorio
          </span>
        </header>
        <div className="grid gap-5 px-5 py-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <ClientTypeField
              value={clientType}
              onChange={changeType}
              disabled={!creating}
            />
          </div>
          <ClientIdentityFields
            form={form}
            clientType={clientType}
            documentType={documentType}
          />
          <ClientContactFields form={form} source={source} />
          <ClientNotesFields form={form} withConsent={creating} />
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

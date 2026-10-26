'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { rateLimitOr } from '@/lib/api/errors';
import { applyApiFormError } from '@/lib/api/form-errors';

import { clearResetPrefill, readResetPrefill } from '../reset-prefill';
import { documentSchema, type DocumentValues } from '../schemas';
import { DocumentFields } from './document-fields';

const FIELDS = ['document_type', 'document_number'] as const;

const GENERIC_REQUEST_ERROR =
  'No pudimos enviar la solicitud. Inténtalo de nuevo.';

type RequestResetFormProps = {
  onSubmit: (values: DocumentValues) => Promise<unknown>;
  onError: (message: string | undefined) => void;
};

export function RequestResetForm({ onSubmit, onError }: RequestResetFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<DocumentValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: readResetPrefill() ?? {
      document_type: 'CC',
      document_number: '',
    },
  });
  const documentType = useWatch({ control, name: 'document_type' });

  // La precarga sirve una sola vez: si la persona vuelve a esta pantalla más tarde, empieza
  // con el formulario vacío.
  useEffect(clearResetPrefill, []);

  const submit = handleSubmit(async (values) => {
    onError(undefined);
    try {
      await onSubmit(values);
    } catch (error) {
      const { needsNotice, firstInvalid } = applyApiFormError(
        error,
        setError,
        FIELDS,
      );
      if (needsNotice) onError(rateLimitOr(error, GENERIC_REQUEST_ERROR));
      if (firstInvalid) setFocus(firstInvalid);
    }
  });

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <DocumentFields
        typeField={register('document_type')}
        numberField={register('document_number')}
        documentType={documentType}
        errors={{
          document_type: errors.document_type?.message,
          document_number: errors.document_number?.message,
        }}
      />
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando…' : 'Enviar enlace'}
      </Button>
    </form>
  );
}

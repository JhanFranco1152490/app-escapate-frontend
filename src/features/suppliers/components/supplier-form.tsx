'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type ReactNode } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';

import { Alert } from '@/components/alert';
import { ButtonLink } from '@/components/button-link';
import { CityDatalist } from '@/components/city-datalist';
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
  CONTACT_REQUIRED_MESSAGE,
  MISSING_MESSAGES,
  supplierFormSchema,
  type SupplierFormValues,
  type SupplierPayload,
} from '../schemas';
import { SupplierCommercialFields } from './supplier-commercial-fields';
import { SupplierContactFields } from './supplier-contact-fields';
import { SupplierFormSection } from './supplier-form-section';
import { SupplierIdentityFields } from './supplier-identity-fields';

// Los campos del formulario que también nombra la API en sus errores.
const FIELDS = [
  'trade_name',
  'legal_name',
  'document_type',
  'document_number',
  'categories',
  'city',
  'coverage_zone',
  'contact_name',
  'contact_role',
  'contact_phone',
  'contact_email',
  'payment_terms',
  'commission_rate',
  'agreement_valid_until',
  'notes',
] as const;

const GENERIC_SAVE_ERROR =
  'No pudimos guardar el proveedor. Inténtalo de nuevo.';

// "Teléfono o correo" es un solo dato que falta, aunque el error se muestre en los dos campos:
// en el conteo del aviso cuenta una vez.
function withOneContactError(
  errors: FieldErrors<SupplierFormValues>,
): FieldErrors<SupplierFormValues> {
  if (errors.contact_phone?.message !== CONTACT_REQUIRED_MESSAGE) return errors;
  const rest = { ...errors };
  delete rest.contact_email;
  return rest;
}

type SupplierFormProps = {
  defaultValues: SupplierFormValues;
  submitLabel: string;
  cancelHref: string;
  onSubmit: (payload: SupplierPayload) => Promise<unknown>;
  // Avisos que no son de validación y van arriba de los campos.
  notices?: ReactNode;
};

export function SupplierForm({
  defaultValues,
  submitLabel,
  cancelHref,
  onSubmit,
  notices,
}: SupplierFormProps) {
  const [notice, setNotice] = useState<FormNotice>();
  const form = useForm<SupplierFormValues, unknown, SupplierPayload>({
    resolver: zodResolver(supplierFormSchema),
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
        invalidFormNotice(withOneContactError(invalid), {
          subject: 'el proveedor',
          requiredMessages: MISSING_MESSAGES,
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
      <SupplierFormSection title="Identificación y clasificación" required>
        <SupplierIdentityFields form={form} />
      </SupplierFormSection>
      <SupplierFormSection title="Contacto">
        <SupplierContactFields form={form} />
      </SupplierFormSection>
      <SupplierFormSection title="Información comercial">
        <SupplierCommercialFields form={form} />
      </SupplierFormSection>
      <CityDatalist />
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

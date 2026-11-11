'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type ReactNode } from 'react';
import { useForm, useWatch, type FieldPath } from 'react-hook-form';

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

import type { ServiceType } from '../api';
import { EMPTY_ATTRIBUTES } from '../form-values';
import {
  MISSING_MESSAGES,
  serviceFormSchema,
  type ServiceFormValues,
  type ServicePayload,
} from '../schemas';
import { DestinationDatalist } from './destination-datalist';
import { ServiceAttributesSection } from './service-attributes-section';
import { ServiceCommonFields } from './service-common-fields';
import { ServiceTypeField } from './service-type-field';

// Los campos del formulario que también nombra la API en sus errores; los propios del tipo
// llegan con su ruta (`attributes.max_capacity`), igual que se llaman aquí.
const FIELDS = [
  'service_type',
  'name',
  'destination',
  'description',
  'conditions',
  ...Object.keys(EMPTY_ATTRIBUTES).map((field) => `attributes.${field}`),
] as FieldPath<ServiceFormValues>[];

const GENERIC_SAVE_ERROR =
  'No pudimos guardar el servicio. Inténtalo de nuevo.';

type TouristServiceFormProps = {
  mode: 'create' | 'edit';
  // El proveedor no se elige: el servicio se registra desde su ficha.
  supplierName: string;
  serviceTypes: readonly ServiceType[];
  defaultValues: ServiceFormValues;
  submitLabel: string;
  cancelHref: string;
  onSubmit: (payload: ServicePayload) => Promise<unknown>;
  // Avisos que no son de validación y van arriba de los campos.
  notices?: ReactNode;
};

export function TouristServiceForm({
  mode,
  supplierName,
  serviceTypes,
  defaultValues,
  submitLabel,
  cancelHref,
  onSubmit,
  notices,
}: TouristServiceFormProps) {
  const [notice, setNotice] = useState<FormNotice>();
  const form = useForm<ServiceFormValues, unknown, ServicePayload>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues,
  });
  const {
    control,
    handleSubmit,
    setValue,
    setError,
    setFocus,
    clearErrors,
    formState: { errors, isSubmitting, isDirty },
  } = form;
  useUnsavedChangesWarning(isDirty);
  const serviceType = useWatch({ control, name: 'service_type' });

  // Los campos propios de un tipo no sirven para otro: se descartan. Los comunes se quedan.
  const changeType = (type: ServiceType) => {
    setValue('service_type', type, { shouldDirty: true });
    setValue('attributes', EMPTY_ATTRIBUTES);
    clearErrors(['service_type', 'attributes']);
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
        if (firstInvalid && firstInvalid !== 'service_type') {
          setFocus(firstInvalid);
        }
      }
    },
    (invalid) =>
      setNotice(
        invalidFormNotice(invalid, {
          subject: 'el servicio',
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
      <FormSection title="Proveedor y tipo" required>
        <div className="flex flex-col gap-2 md:col-span-2">
          <span className="text-sm font-medium">Proveedor</span>
          <p className="text-base">{supplierName}</p>
        </div>
        <ServiceTypeField
          types={serviceTypes}
          value={serviceType}
          onChange={changeType}
          error={errors.service_type?.message}
          disabled={mode === 'edit'}
        />
      </FormSection>
      <FormSection title="Datos del servicio">
        <ServiceCommonFields form={form} />
      </FormSection>
      <ServiceAttributesSection
        form={form}
        type={serviceTypes.find((type) => type === serviceType)}
      />
      <DestinationDatalist />
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

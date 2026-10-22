'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Alert } from '@/components/alert';
import { ButtonLink } from '@/components/button-link';
import { FormField, fieldAriaProps } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { rateLimitOr } from '@/lib/api/errors';
import { applyApiFormError } from '@/lib/api/form-errors';
import { useUnsavedChangesWarning } from '@/lib/use-unsaved-changes-warning';

import type { PermissionItem } from '../api';
import {
  roleFormSchema,
  type RoleFormValues,
  type RoleValues,
} from '../schemas';
import { PermissionMatrix } from './permission-matrix';

const FIELDS = ['name', 'description', 'permissions'] as const;
const DESCRIPTION_HINT =
  'Opcional. Se muestra al elegir el rol de una persona.';
const GENERIC_SAVE_ERROR = 'No pudimos guardar el rol. Inténtalo de nuevo.';

type RoleFormProps = {
  catalog: PermissionItem[];
  defaultValues: RoleFormValues;
  submitLabel: string;
  cancelHref: string;
  onSubmit: (values: RoleValues) => Promise<unknown>;
};

export function RoleForm({
  catalog,
  defaultValues,
  submitLabel,
  cancelHref,
  onSubmit,
}: RoleFormProps) {
  const [notice, setNotice] = useState<string>();
  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<RoleFormValues, unknown, RoleValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues,
  });
  useUnsavedChangesWarning(isDirty);

  const submit = handleSubmit(async (values) => {
    setNotice(undefined);
    try {
      await onSubmit(values);
    } catch (error) {
      const { needsNotice, firstInvalid } = applyApiFormError(
        error,
        setError,
        FIELDS,
      );
      if (needsNotice) setNotice(rateLimitOr(error, GENERIC_SAVE_ERROR));
      if (firstInvalid && firstInvalid !== 'permissions')
        setFocus(firstInvalid);
    }
  });

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
      {notice && <Alert title={notice} />}
      <section className="grid gap-5 rounded-md border bg-card px-5 py-5 md:grid-cols-2">
        <FormField
          id="name"
          label="Nombre"
          required
          error={errors.name?.message}
        >
          <Input
            id="name"
            autoComplete="off"
            className="h-11"
            {...register('name')}
            {...fieldAriaProps('name', { error: errors.name?.message })}
          />
        </FormField>
        <FormField
          id="description"
          label="Descripción"
          hint={DESCRIPTION_HINT}
          error={errors.description?.message}
        >
          <Input
            id="description"
            autoComplete="off"
            className="h-11"
            {...register('description')}
            {...fieldAriaProps('description', {
              hint: DESCRIPTION_HINT,
              error: errors.description?.message,
            })}
          />
        </FormField>
      </section>
      <Controller
        control={control}
        name="permissions"
        render={({ field }) => (
          <PermissionMatrix
            catalog={catalog}
            value={field.value}
            onChange={field.onChange}
            error={errors.permissions?.message}
          />
        )}
      />
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

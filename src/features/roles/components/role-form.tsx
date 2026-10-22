'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Alert } from '@/components/alert';
import { ButtonLink } from '@/components/button-link';
import { FormField, fieldAriaProps } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getErrorMessage } from '@/lib/api/errors';
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

// Qué se puede editar: todo, solo la descripción (el rol protegido) o nada (sin permiso
// para gestionar roles).
export type RoleFormLock = 'none' | 'protected' | 'all';

type RoleFormProps = {
  catalog: PermissionItem[];
  defaultValues: RoleFormValues;
  submitLabel: string;
  // Al crear, "Cancelar" vuelve a la lista; al editar, "Descartar cambios" vuelve a lo
  // guardado.
  cancelHref?: string;
  lock?: RoleFormLock;
  onSubmit: (values: RoleValues) => Promise<unknown>;
};

export function RoleForm({
  catalog,
  defaultValues,
  submitLabel,
  cancelHref,
  lock = 'none',
  onSubmit,
}: RoleFormProps) {
  const [notice, setNotice] = useState<string>();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<RoleFormValues, unknown, RoleValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues,
  });
  useUnsavedChangesWarning(isDirty);
  const nameLocked = lock !== 'none';

  const submit = handleSubmit(async (values) => {
    setNotice(undefined);
    try {
      await onSubmit(values);
      // Lo guardado pasa a ser el punto de partida: "Descartar cambios" vuelve aquí y el
      // navegador deja de avisar al salir.
      reset(undefined, { keepValues: true });
    } catch (error) {
      const { needsNotice, firstInvalid } = applyApiFormError(
        error,
        setError,
        FIELDS,
      );
      // Un conflicto (rol protegido, el propio rol, el último gestor) trae su motivo.
      if (needsNotice) setNotice(getErrorMessage(error, GENERIC_SAVE_ERROR));
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
            disabled={nameLocked}
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
            disabled={lock === 'all'}
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
            disabled={nameLocked}
            error={errors.permissions?.message}
          />
        )}
      />
      {lock !== 'all' && (
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {cancelHref ? (
            <ButtonLink href={cancelHref} variant="outline">
              Cancelar
            </ButtonLink>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={!isDirty || isSubmitting}
              onClick={() => {
                reset();
                setNotice(undefined);
              }}
            >
              Descartar cambios
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}

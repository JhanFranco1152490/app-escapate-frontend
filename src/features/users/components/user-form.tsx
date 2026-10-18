'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { Alert } from '@/components/alert';
import { FormField, fieldAriaProps } from '@/components/form-field';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DocumentFields } from '@/features/auth/components/document-fields';
import { rateLimitOr } from '@/lib/api/errors';
import { applyApiFormError } from '@/lib/api/form-errors';

import {
  SERVER_FIELDS_NOTICE,
  invalidFormNotice,
  type FormNotice,
} from '../form-notice';
import {
  createUserSchema,
  type CreateUserValues,
  type UserFormValues,
} from '../schemas';
import { PhoneField } from './phone-field';
import { RoleField } from './role-field';

const FIELDS = [
  'first_name',
  'last_name',
  'email',
  'document_type',
  'document_number',
  'phone',
  'role_id',
] as const;

const TEXT_FIELDS = [
  { name: 'first_name', label: 'Nombres', autoComplete: 'off' },
  { name: 'last_name', label: 'Apellidos', autoComplete: 'off' },
  { name: 'email', label: 'Correo electrónico', autoComplete: 'off' },
] as const;

const GENERIC_SAVE_ERROR = 'No pudimos guardar el usuario. Inténtalo de nuevo.';

type UserFormProps = {
  defaultValues: UserFormValues;
  // En edición el rol se muestra con su nombre y no se puede cambiar.
  roleName?: string;
  submitLabel: string;
  cancelHref: string;
  onSubmit: (values: CreateUserValues) => Promise<unknown>;
};

// Un solo schema para alta y edición: en edición el rol viaja en los valores (fijo, sin campo
// que lo cambie) y quien envía decide qué campos manda a la API.
export function UserForm({
  defaultValues,
  roleName,
  submitLabel,
  cancelHref,
  onSubmit,
}: UserFormProps) {
  const [notice, setNotice] = useState<FormNotice>();
  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues, unknown, CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues,
  });
  const documentType = useWatch({ control, name: 'document_type' });

  const submit = handleSubmit(
    async (values) => {
      setNotice(undefined);
      try {
        await onSubmit(values);
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
    (invalid) => setNotice(invalidFormNotice(invalid)),
  );

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
      {notice && (
        <Alert title={notice.title}>
          {notice.body && <p>{notice.body}</p>}
        </Alert>
      )}
      <section className="rounded-md border bg-card">
        <header className="flex items-center justify-between gap-3 border-b px-5 py-4">
          <h2 className="font-heading text-lg font-semibold">
            Datos de la persona
          </h2>
          <span className="font-mono text-[0.625rem] tracking-[0.16em] text-muted-foreground uppercase">
            * Obligatorio
          </span>
        </header>
        <div className="grid gap-5 px-5 py-5 md:grid-cols-2">
          {TEXT_FIELDS.map(({ name, label, autoComplete }) => (
            <FormField
              key={name}
              id={name}
              label={label}
              required
              error={errors[name]?.message}
            >
              <Input
                id={name}
                type={name === 'email' ? 'email' : 'text'}
                autoComplete={autoComplete}
                className="h-11"
                {...register(name)}
                {...fieldAriaProps(name, { error: errors[name]?.message })}
              />
            </FormField>
          ))}
          <PhoneField field={register('phone')} error={errors.phone?.message} />
          <DocumentFields
            typeField={register('document_type')}
            numberField={register('document_number')}
            documentType={documentType}
            autoComplete="off"
            errors={{
              document_type: errors.document_type?.message,
              document_number: errors.document_number?.message,
            }}
          />
          <div className="md:col-span-2">
            {roleName ? (
              <RoleField mode="edit" roleName={roleName} />
            ) : (
              <RoleField
                mode="create"
                field={register('role_id')}
                error={errors.role_id?.message}
              />
            )}
          </div>
        </div>
        <footer className="flex flex-col-reverse gap-3 border-t px-5 py-4 sm:flex-row sm:justify-end">
          <Link
            href={cancelHref}
            className={buttonVariants({ variant: 'outline' })}
          >
            Cancelar
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : submitLabel}
          </Button>
        </footer>
      </section>
    </form>
  );
}

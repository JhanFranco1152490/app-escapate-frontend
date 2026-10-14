'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import { FormField, fieldAriaProps } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { isApiError } from '@/lib/api/errors';
import { applyApiFieldErrors } from '@/lib/api/form-errors';

import {
  GENERIC_LOGIN_NOTICE,
  loginNoticeFromError,
  type LoginNotice,
} from '../login-errors';
import { loginSchema, type LoginValues } from '../schemas';
import { DocumentFields } from './document-fields';
import { PasswordInput } from './password-input';

const FIELDS = ['document_type', 'document_number', 'password'] as const;

type DocumentLoginFormProps = {
  onSubmit: (values: LoginValues) => Promise<unknown>;
  onNotice: (notice: LoginNotice | undefined) => void;
};

export function DocumentLoginForm({
  onSubmit,
  onNotice,
}: DocumentLoginFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { document_type: 'CC', document_number: '', password: '' },
  });
  const documentType = useWatch({ control, name: 'document_type' });

  const submit = handleSubmit(async (values) => {
    onNotice(undefined);
    try {
      await onSubmit(values);
    } catch (error) {
      resetField('password');
      const { applied, unmatched } = applyApiFieldErrors(
        error,
        setError,
        FIELDS,
      );
      const isValidation =
        isApiError(error) && error.code === 'validation_error';
      if (!isValidation) onNotice(loginNoticeFromError(error));
      else if (!applied || unmatched.length) onNotice(GENERIC_LOGIN_NOTICE);
      const firstInvalid = isApiError(error)
        ? FIELDS.find((field) => error.fields[field]?.length)
        : undefined;
      setFocus(firstInvalid ?? 'password');
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
      <FormField
        id="password"
        label="Contraseña"
        required
        error={errors.password?.message}
      >
        <PasswordInput
          id="password"
          autoComplete="current-password"
          className="h-11"
          {...register('password')}
          {...fieldAriaProps('password', { error: errors.password?.message })}
        />
      </FormField>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
}

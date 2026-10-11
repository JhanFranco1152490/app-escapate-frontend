'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import { FormField, fieldErrorId } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { isApiError } from '@/lib/api/errors';
import { applyApiFieldErrors } from '@/lib/api/form-errors';

import {
  GENERIC_LOGIN_NOTICE,
  loginNoticeFromError,
  type LoginNotice,
} from '../login-errors';
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  loginSchema,
  type LoginValues,
} from '../schemas';
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

  const invalidProps = (field: (typeof FIELDS)[number]) =>
    errors[field]
      ? { 'aria-invalid': true, 'aria-describedby': fieldErrorId(field) }
      : {};

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <FormField
        id="document_type"
        label="Tipo de documento"
        required
        error={errors.document_type?.message}
      >
        <NativeSelect
          id="document_type"
          className="w-full [&_select]:h-11"
          {...register('document_type')}
          {...invalidProps('document_type')}
        >
          {DOCUMENT_TYPES.map((type) => (
            <NativeSelectOption key={type} value={type}>
              {DOCUMENT_TYPE_LABELS[type]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>
      <FormField
        id="document_number"
        label="Número de documento"
        required
        error={errors.document_number?.message}
      >
        <Input
          id="document_number"
          autoComplete="username"
          // CE, PPT y pasaporte pueden llevar letras: solo la cédula usa el teclado numérico.
          inputMode={documentType === 'CC' ? 'numeric' : 'text'}
          className="h-11"
          {...register('document_number')}
          {...invalidProps('document_number')}
        />
      </FormField>
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
          {...invalidProps('password')}
        />
      </FormField>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
}

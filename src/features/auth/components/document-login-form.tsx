'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Suspense, type ComponentType } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { FormField, fieldAriaProps } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { applyApiFormError } from '@/lib/api/form-errors';

import {
  GENERIC_LOGIN_NOTICE,
  loginNoticeFromError,
  type LoginNotice,
} from '../login-errors';
import { loginSchema, type LoginValues } from '../schemas';
import { DocumentFields } from './document-fields';
import { PasswordInput } from './password-input';
import { RecoveryLink } from './recovery-link';

const FIELDS = ['document_type', 'document_number', 'password'] as const;

export type QuickAccessProps = {
  onSelect: (values: LoginValues) => void;
  disabled: boolean;
};

type DocumentLoginFormProps = {
  onSubmit: (values: LoginValues) => Promise<unknown>;
  onNotice: (notice: LoginNotice | undefined) => void;
  // Atajo para entrar sin escribir: llena los campos y envía el formulario, así los errores
  // se muestran igual que al escribirlos a mano.
  QuickAccess?: ComponentType<QuickAccessProps>;
};

export function DocumentLoginForm({
  onSubmit,
  onNotice,
  QuickAccess,
}: DocumentLoginFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    resetField,
    setValue,
    getValues,
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
      const { isValidation, needsNotice, firstInvalid } = applyApiFormError(
        error,
        setError,
        FIELDS,
      );
      if (needsNotice) {
        onNotice(
          isValidation ? GENERIC_LOGIN_NOTICE : loginNoticeFromError(error),
        );
      }
      setFocus(firstInvalid ?? 'password');
    }
  });

  function signInWith(values: LoginValues) {
    setValue('document_type', values.document_type);
    setValue('document_number', values.document_number);
    setValue('password', values.password);
    void submit();
  }

  return (
    <>
      {QuickAccess && (
        <Suspense fallback={null}>
          <QuickAccess onSelect={signInWith} disabled={isSubmitting} />
        </Suspense>
      )}
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
        <RecoveryLink
          getDocument={() => ({
            document_type: getValues('document_type'),
            document_number: getValues('document_number'),
          })}
          className="-mt-2 self-end text-[0.8125rem] text-orange-400 underline-offset-4 hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </RecoveryLink>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </>
  );
}

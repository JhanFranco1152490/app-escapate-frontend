'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Alert } from '@/components/alert';
import { FormField, fieldAriaProps } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { RATE_LIMIT_MESSAGE, isApiError } from '@/lib/api/errors';
import { applyApiFieldErrors } from '@/lib/api/form-errors';

import { useConfirmPasswordReset } from '../api';
import { setPasswordSchema, type SetPasswordValues } from '../schemas';
import { PasswordInput } from './password-input';

const FIELDS = ['password', 'password_confirmation'] as const;
const PASSWORD_HINT =
  'Mínimo 12 caracteres. Una frase larga es más segura que una palabra con símbolos.';
const GENERIC_ERROR = 'No pudimos guardar la contraseña. Inténtalo de nuevo.';

type SetPasswordFormProps = {
  token: string;
  submitLabel: string;
  submittingLabel: string;
  onExpired: () => void;
};

export function SetPasswordForm({
  token,
  submitLabel,
  submittingLabel,
  onExpired,
}: SetPasswordFormProps) {
  const router = useRouter();
  const confirm = useConfirmPasswordReset();
  const [notice, setNotice] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: '', password_confirmation: '' },
  });

  const submit = handleSubmit(async (values) => {
    setNotice(undefined);
    try {
      // La sesión queda en la caché antes de navegar, así la guardia del panel no la pide.
      await confirm.mutateAsync({ token, ...values });
      router.replace('/');
    } catch (error) {
      if (isApiError(error) && error.code === 'invalid_reset_token') {
        onExpired();
        return;
      }
      FIELDS.forEach((field) => resetField(field));
      const { applied, unmatched } = applyApiFieldErrors(
        error,
        setError,
        FIELDS,
      );
      const isValidation =
        isApiError(error) && error.code === 'validation_error';
      if (!isValidation || !applied || unmatched.length) {
        const throttled = isApiError(error) && error.code === 'throttled';
        setNotice(throttled ? RATE_LIMIT_MESSAGE : GENERIC_ERROR);
      }
      setFocus('password');
    }
  });

  const passwordError = errors.password?.message;
  const confirmationError = errors.password_confirmation?.message;

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      {notice && <Alert>{notice}</Alert>}
      <FormField
        id="password"
        label="Nueva contraseña"
        required
        hint={PASSWORD_HINT}
        error={passwordError}
      >
        <PasswordInput
          id="password"
          autoComplete="new-password"
          className="h-11"
          {...register('password')}
          {...fieldAriaProps('password', {
            hint: PASSWORD_HINT,
            error: passwordError,
          })}
        />
      </FormField>
      <FormField
        id="password_confirmation"
        label="Confirmar contraseña"
        required
        error={confirmationError}
      >
        <PasswordInput
          id="password_confirmation"
          autoComplete="new-password"
          className="h-11"
          {...register('password_confirmation')}
          {...fieldAriaProps('password_confirmation', {
            error: confirmationError,
          })}
        />
      </FormField>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? submittingLabel : submitLabel}
      </Button>
    </form>
  );
}

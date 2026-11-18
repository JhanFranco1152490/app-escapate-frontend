'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';

import { Alert } from '@/components/alert';
import {
  FormField,
  fieldAriaProps,
  fieldErrorId,
} from '@/components/form-field';
import { Textarea } from '@/components/textarea';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

import {
  closeFormSchema,
  type CloseFormValues,
  type ClosePayload,
} from '../close-schema';
import { CLOSE_REASON_LABELS, CLOSE_REASONS } from '../labels';

type CloseRequestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
  pending: boolean;
  // Si cerrar falla, el diálogo queda abierto con el motivo.
  error?: string;
  onConfirm: (payload: ClosePayload) => void;
};

// Cerrar pide el motivo, para saber después por qué no se vendió; la nota solo es obligatoria
// con "Otro". Mientras se guarda, el diálogo no se puede cerrar.
export function CloseRequestDialog({
  open,
  onOpenChange,
  code,
  pending,
  error,
  onConfirm,
}: CloseRequestDialogProps) {
  const form = useForm<CloseFormValues, unknown, ClosePayload>({
    resolver: zodResolver(closeFormSchema),
    defaultValues: { reason: '', note: '' },
  });
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = form;
  const reason = useWatch({ control, name: 'reason' });
  const reasonError = errors.reason?.message;
  const noteError = errors.note?.message;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
      }}
    >
      <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
        <form
          noValidate
          onSubmit={handleSubmit(onConfirm)}
          className="flex flex-col gap-4"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              Cerrar la solicitud {code}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Sale de &ldquo;Por cotizar&rdquo; y ya no se puede editar. Se
              puede reabrir después.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <fieldset
            className="flex flex-col gap-1"
            {...fieldAriaProps('reason', { error: reasonError })}
          >
            <legend className="mb-2 text-sm font-medium">
              Motivo
              <span aria-hidden="true" className="ml-1 text-destructive">
                *
              </span>
            </legend>
            {CLOSE_REASONS.map((value) => (
              <label
                key={value}
                className="flex min-h-11 items-center gap-3 text-[0.875rem]"
              >
                <input
                  type="radio"
                  value={value}
                  className="size-4 shrink-0 accent-orange-500"
                  {...register('reason')}
                />
                {CLOSE_REASON_LABELS[value]}
              </label>
            ))}
            {reasonError && (
              <p
                id={fieldErrorId('reason')}
                className="flex items-center gap-1.5 text-[0.78125rem] text-destructive"
              >
                <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
                {reasonError}
              </p>
            )}
          </fieldset>
          <FormField
            id="close-note"
            label="Nota"
            required={reason === 'other'}
            error={noteError}
          >
            <Textarea
              id="close-note"
              maxLength={300}
              {...register('note')}
              {...fieldAriaProps('close-note', { error: noteError })}
            />
          </FormField>
          {error && <Alert>{error}</Alert>}
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={pending}>
              Cancelar
            </AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? 'Un momento…' : 'Cerrar solicitud'}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

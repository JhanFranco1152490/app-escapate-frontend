'use client';

import { useState } from 'react';

import { Alert } from '@/components/alert';
import { Textarea } from '@/components/textarea';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { actionErrorMessage } from '@/lib/action-feedback';

import { useCompleteFollowUp, type FollowUp } from '../follow-up-api';

type CompleteFollowUpDialogProps = {
  followUp: FollowUp;
  onClose: () => void;
  onDone: () => void;
};

// Registrar qué pasó en el contacto y, si el cliente lo pide, programar el siguiente.
export function CompleteFollowUpDialog({
  followUp,
  onClose,
  onDone,
}: CompleteFollowUpDialogProps) {
  const complete = useCompleteFollowUp();
  const [outcome, setOutcome] = useState('');
  const [nextDate, setNextDate] = useState('');

  const save = () =>
    complete.mutate(
      {
        id: followUp.id,
        body: {
          outcome: outcome.trim() || null,
          next_due_date: nextDate || null,
        },
      },
      { onSuccess: onDone },
    );

  return (
    <AlertDialog
      open
      onOpenChange={(open) => !open && !complete.isPending && onClose()}
    >
      <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold">
            Registrar seguimiento
          </AlertDialogTitle>
        </AlertDialogHeader>
        <p className="text-sm text-muted-foreground">{followUp.purpose}</p>
        {complete.isError && (
          <Alert title={actionErrorMessage(complete.error)} />
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="follow-up-outcome">¿Qué respondió el cliente?</Label>
          <Textarea
            id="follow-up-outcome"
            maxLength={2000}
            value={outcome}
            onChange={(event) => setOutcome(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="follow-up-next">
            Volver a contactar el (opcional)
          </Label>
          <Input
            id="follow-up-next"
            type="date"
            className="h-11"
            value={nextDate}
            onChange={(event) => setNextDate(event.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={complete.isPending}>
            Cancelar
          </AlertDialogCancel>
          <Button onClick={save} disabled={complete.isPending}>
            {complete.isPending ? 'Guardando…' : 'Registrar'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

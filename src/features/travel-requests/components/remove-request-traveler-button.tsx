'use client';

import { useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { actionErrorMessage } from '@/lib/action-feedback';

import {
  useRemoveRequestTraveler,
  type RequestTraveler,
} from '../request-travelers-api';

type RemoveRequestTravelerButtonProps = {
  requestId: number;
  traveler: RequestTraveler;
  onRemoved: (text: string) => void;
};

// Quitar solo borra la asociación: la persona sigue registrada en Viajeros.
export function RemoveRequestTravelerButton({
  requestId,
  traveler,
  onRemoved,
}: RemoveRequestTravelerButtonProps) {
  const [open, setOpen] = useState(false);
  const remove = useRemoveRequestTraveler(requestId);

  const openDialog = () => {
    remove.reset();
    setOpen(true);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        aria-label={`Quitar a ${traveler.full_name}`}
        onClick={openDialog}
      >
        Quitar
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Quitar a ${traveler.full_name}`}
        description="Deja de aparecer en esta solicitud. Sus datos no se borran: sigue registrado en Viajeros y se puede agregar de nuevo."
        confirmLabel="Quitar"
        pending={remove.isPending}
        error={remove.isError ? actionErrorMessage(remove.error) : undefined}
        onConfirm={() =>
          remove.mutate(traveler.id, {
            onSuccess: () => {
              setOpen(false);
              onRemoved(`${traveler.full_name} ya no está en la solicitud.`);
            },
          })
        }
      />
    </>
  );
}

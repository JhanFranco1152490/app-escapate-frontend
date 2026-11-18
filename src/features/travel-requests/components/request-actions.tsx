'use client';

import { Pencil } from 'lucide-react';
import { useState } from 'react';

import { ButtonLink } from '@/components/button-link';
import { Button } from '@/components/ui/button';
import { actionErrorMessage, type ActionFeedback } from '@/lib/action-feedback';

import type { TravelRequestDetail } from '../api';
import type { ClosePayload } from '../close-schema';
import { useCloseTravelRequest, useReopenTravelRequest } from '../mutations';
import { CloseRequestDialog } from './close-request-dialog';

type RequestActionsProps = {
  request: TravelRequestDetail;
  onDone: (feedback: ActionFeedback) => void;
};

// Una solicitud abierta se edita o se cierra; una cerrada solo se reabre. Las dos acciones van
// con la versión de la ficha que se está mirando. Reabrir no pide confirmación: no borra nada
// y se deshace cerrándola otra vez.
export function RequestActions({ request, onDone }: RequestActionsProps) {
  const [closing, setClosing] = useState(false);
  const close = useCloseTravelRequest(request.id);
  const reopen = useReopenTravelRequest(request.id);

  const openDialog = () => {
    // Un error de un intento anterior no se arrastra a uno nuevo.
    close.reset();
    setClosing(true);
  };

  const confirmClose = (payload: ClosePayload) =>
    close.mutate(
      { ...payload, expected_version: request.version },
      {
        onSuccess: () => {
          setClosing(false);
          onDone({ variant: 'info', text: 'Solicitud cerrada.' });
        },
      },
    );

  const runReopen = () =>
    reopen.mutate(
      { expected_version: request.version },
      {
        onSuccess: () =>
          onDone({ variant: 'info', text: 'Solicitud reabierta.' }),
        onError: (error) =>
          onDone({ variant: 'error', text: actionErrorMessage(error) }),
      },
    );

  if (request.status === 'closed') {
    return (
      <Button disabled={reopen.isPending} onClick={runReopen}>
        Reabrir
      </Button>
    );
  }

  return (
    <>
      <ButtonLink href={`/solicitudes/${request.id}/editar`} variant="outline">
        <Pencil aria-hidden="true" />
        Editar datos
      </ButtonLink>
      <Button variant="destructive" onClick={openDialog}>
        Cerrar solicitud
      </Button>
      {/* Se monta al abrirse: así cada vez empieza sin el motivo anterior. */}
      {closing && (
        <CloseRequestDialog
          open={closing}
          onOpenChange={setClosing}
          code={request.code}
          pending={close.isPending}
          error={close.isError ? actionErrorMessage(close.error) : undefined}
          onConfirm={confirmClose}
        />
      )}
    </>
  );
}

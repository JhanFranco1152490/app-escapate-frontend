'use client';

import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { actionErrorMessage, type ActionFeedback } from '@/lib/action-feedback';
import { isStaleVersion } from '@/lib/api/errors';

import { useDeleteRate, type ServiceRate } from '../rate-api';

const CHANGED_BEFORE_DELETE =
  'Alguien cambió esta tarifa antes de borrarla. La tabla ya muestra la versión actual.';

type DeleteRateButtonProps = {
  serviceId: number;
  rate: Pick<ServiceRate, 'id' | 'name' | 'version'>;
  onDone: (feedback: ActionFeedback) => void;
};

// Borrar no se puede deshacer: pide confirmación. Si otra persona cambió la tarifa en el
// medio, no se borra lo que ella guardó: se cierra el diálogo y la tabla se recarga para que
// se vea antes de decidir otra vez.
export function DeleteRateButton({
  serviceId,
  rate,
  onDone,
}: DeleteRateButtonProps) {
  const [open, setOpen] = useState(false);
  const deleteRate = useDeleteRate(serviceId);
  const { reset } = deleteRate;

  // Un error de un intento anterior no se arrastra a uno nuevo.
  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const confirm = () =>
    deleteRate.mutate(
      { rateId: rate.id, expectedVersion: rate.version },
      {
        onSuccess: () => {
          setOpen(false);
          onDone({ variant: 'info', text: 'Tarifa borrada.' });
        },
        onError: (error) => {
          if (!isStaleVersion(error)) return;
          setOpen(false);
          onDone({ variant: 'error', text: CHANGED_BEFORE_DELETE });
        },
      },
    );

  return (
    <>
      {/* El nombre dice qué tarifa, porque cada fila tiene su "Borrar". */}
      <Button
        variant="outline"
        size="sm"
        aria-label={`Borrar ${rate.name}`}
        onClick={() => setOpen(true)}
      >
        <Trash2 aria-hidden="true" />
        Borrar
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="¿Borrar la tarifa?"
        description={`Se borrará la tarifa ${rate.name}. Esta acción no se puede deshacer.`}
        confirmLabel="Borrar"
        pending={deleteRate.isPending}
        error={
          deleteRate.isError && !isStaleVersion(deleteRate.error)
            ? actionErrorMessage(deleteRate.error)
            : undefined
        }
        onConfirm={confirm}
      />
    </>
  );
}

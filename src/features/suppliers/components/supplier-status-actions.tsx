'use client';

import { useEffect, useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { actionErrorMessage, type ActionFeedback } from '@/lib/action-feedback';

import { useChangeSupplierStatus, type SupplierDetail } from '../api';

type SupplierStatusActionsProps = {
  supplier: Pick<SupplierDetail, 'id' | 'trade_name' | 'is_active' | 'version'>;
  onDone: (feedback: ActionFeedback) => void;
};

// Desactivar pide confirmación; activar no, porque devuelve el proveedor a la oferta en vez
// de quitarlo. Las dos envían la versión de la ficha que se está mirando.
export function SupplierStatusActions({
  supplier,
  onDone,
}: SupplierStatusActionsProps) {
  const [open, setOpen] = useState(false);
  const change = useChangeSupplierStatus(supplier.id);
  const { reset } = change;

  // Un error de un intento anterior no se arrastra a uno nuevo.
  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const run = (action: 'deactivate' | 'activate') =>
    change.mutate(
      { action, expectedVersion: supplier.version },
      {
        onSuccess: () => {
          setOpen(false);
          onDone({
            variant: 'info',
            text:
              action === 'deactivate'
                ? 'Proveedor desactivado.'
                : 'Proveedor activado.',
          });
        },
        onError: (error) => {
          if (action === 'activate') {
            onDone({ variant: 'error', text: actionErrorMessage(error) });
          }
        },
      },
    );

  if (!supplier.is_active) {
    return (
      <Button disabled={change.isPending} onClick={() => run('activate')}>
        Activar
      </Button>
    );
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Desactivar
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`¿Desactivar a ${supplier.trade_name}?`}
        description={`${supplier.trade_name} dejará de aparecer al registrar servicios y en la oferta turística. Su información y su historial se conservan.`}
        confirmLabel="Desactivar"
        pending={change.isPending}
        error={change.isError ? actionErrorMessage(change.error) : undefined}
        onConfirm={() => run('deactivate')}
      />
    </>
  );
}

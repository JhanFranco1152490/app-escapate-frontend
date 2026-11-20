'use client';

import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { actionErrorMessage, type ActionFeedback } from '@/lib/action-feedback';

import type { QuoteItem } from '../api';
import { useRemoveQuoteItem } from '../mutations';

type RemoveQuoteItemButtonProps = {
  quoteId: number;
  item: Pick<QuoteItem, 'id' | 'name'>;
  onDone: (feedback: ActionFeedback) => void;
};

export function RemoveQuoteItemButton({
  quoteId,
  item,
  onDone,
}: RemoveQuoteItemButtonProps) {
  const [open, setOpen] = useState(false);
  const removeItem = useRemoveQuoteItem(quoteId);

  const confirm = () =>
    removeItem.mutate(item.id, {
      onSuccess: () => {
        setOpen(false);
        onDone({ variant: 'info', text: 'Servicio quitado.' });
      },
    });

  return (
    <>
      {/* El nombre dice qué servicio, porque cada fila tiene su "Quitar". */}
      <Button
        variant="outline"
        size="sm"
        aria-label={`Quitar ${item.name}`}
        onClick={() => {
          removeItem.reset();
          setOpen(true);
        }}
      >
        <Trash2 aria-hidden="true" />
        Quitar
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="¿Quitar el servicio?"
        description={`Se quitará ${item.name} de la cotización.`}
        confirmLabel="Quitar"
        pending={removeItem.isPending}
        error={
          removeItem.isError ? actionErrorMessage(removeItem.error) : undefined
        }
        onConfirm={confirm}
      />
    </>
  );
}

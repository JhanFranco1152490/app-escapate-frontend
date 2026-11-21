'use client';

import { ArrowUpFromLine } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { actionErrorMessage, type ActionFeedback } from '@/lib/action-feedback';

import type { QuoteItem } from '../api';
import { useChooseAlternative } from '../mutations';

type ChooseAlternativeButtonProps = {
  quoteId: number;
  item: Pick<QuoteItem, 'id' | 'name'>;
  onDone: (feedback: ActionFeedback) => void;
};

// Sin confirmación: el cambio se deshace eligiendo de nuevo el servicio que estaba, que queda
// como alternativa.
export function ChooseAlternativeButton({
  quoteId,
  item,
  onDone,
}: ChooseAlternativeButtonProps) {
  const choose = useChooseAlternative(quoteId);

  return (
    <Button
      variant="outline"
      size="sm"
      aria-label={`Usar ${item.name} en la cotización`}
      disabled={choose.isPending}
      onClick={() =>
        choose.mutate(item.id, {
          onSuccess: () =>
            onDone({
              variant: 'info',
              text: `${item.name} pasa a la cotización; el servicio anterior queda como alternativa.`,
            }),
          onError: (error) =>
            onDone({ variant: 'error', text: actionErrorMessage(error) }),
        })
      }
    >
      <ArrowUpFromLine aria-hidden="true" />
      Usar esta
    </Button>
  );
}

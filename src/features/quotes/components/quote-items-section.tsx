'use client';

import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';

import { Alert } from '@/components/alert';
import { Button } from '@/components/ui/button';
import { useHasPermission } from '@/features/auth/permissions';
import type { ActionFeedback } from '@/lib/action-feedback';

import { useQuote, type QuoteDetail } from '../api';
import { QuoteItemPanel, type ItemPanelState } from './quote-item-panel';
import { QuoteItemsTable } from './quote-items-table';
import { RemoveQuoteItemButton } from './remove-quote-item-button';

// Los servicios que componen la propuesta. Mientras es borrador se agregan, editan y quitan
// en un panel al lado de la tabla.
export function QuoteItemsSection({ quote }: { quote: QuoteDetail }) {
  const canManage = useHasPermission('quotes.manage');
  const editable = canManage && quote.status === 'draft';
  const [panel, setPanel] = useState<ItemPanelState>();
  const [feedback, setFeedback] = useState<ActionFeedback>();
  const query = useQuote(quote.id);

  const reloadItem = (itemId: number) => async () => {
    const { data } = await query.refetch();
    return { data: data?.items.find((item) => item.id === itemId) };
  };

  const done = (text: string) => {
    setPanel(undefined);
    setFeedback({ variant: 'info', text });
  };

  return (
    <section
      aria-labelledby="quote-items-title"
      className="rounded-md border bg-card"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <h2
          id="quote-items-title"
          className="font-heading text-lg font-semibold"
        >
          Servicios
        </h2>
        {editable && (
          <Button
            variant="outline"
            onClick={() => {
              setFeedback(undefined);
              setPanel({ mode: 'create' });
            }}
          >
            <Plus aria-hidden="true" />
            Agregar servicio
          </Button>
        )}
      </header>
      {feedback && (
        <div className="px-5 pt-4">
          <Alert variant={feedback.variant} title={feedback.text} />
        </div>
      )}
      <div
        className={
          panel ? 'grid lg:grid-cols-[minmax(0,1fr)_26rem]' : undefined
        }
      >
        <div className="min-w-0">
          {quote.items.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">
              Todavía no hay servicios. Agrega el alojamiento, los vuelos, los
              traslados y lo demás que incluye la propuesta.
            </p>
          ) : (
            <QuoteItemsTable
              items={quote.items}
              actions={
                editable
                  ? (item) => (
                      <div className="flex gap-2 md:justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label={`Editar ${item.name}`}
                          onClick={() => {
                            setFeedback(undefined);
                            setPanel({ mode: 'edit', item });
                          }}
                        >
                          <Pencil aria-hidden="true" />
                          Editar
                        </Button>
                        <RemoveQuoteItemButton
                          quoteId={quote.id}
                          item={item}
                          onDone={setFeedback}
                        />
                      </div>
                    )
                  : undefined
              }
            />
          )}
        </div>
        {panel && editable && (
          <QuoteItemPanel
            state={panel}
            quote={quote}
            reloadItem={reloadItem}
            onSaved={done}
            onClose={() => setPanel(undefined)}
          />
        )}
      </div>
    </section>
  );
}

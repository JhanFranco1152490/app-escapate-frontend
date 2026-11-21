'use client';

import { useState } from 'react';

import { Alert } from '@/components/alert';
import { StaleVersionNotice } from '@/components/stale-version-notice';
import { isApiError } from '@/lib/api/errors';
import { useVersionedEdit } from '@/lib/use-versioned-edit';

import type { QuoteDetail, QuoteItem } from '../api';
import { emptyItemForm, itemFormValues } from '../form-values';
import { useAddQuoteItem, useUpdateQuoteItem } from '../mutations';
import type { ItemPayload } from '../schemas';
import { QuoteItemForm } from './quote-item-form';

// Solo los servicios incluidos: una alternativa no tiene alternativas propias.
const alternativeChoices = (quote: QuoteDetail, exceptId?: number) =>
  quote.items
    .filter((item) => item.alternative_of_id === null && item.id !== exceptId)
    .map(({ id, name }) => ({ id, name }));

export type ItemPanelState =
  { mode: 'create' } | { mode: 'edit'; item: QuoteItem };

type QuoteItemPanelProps = {
  state: ItemPanelState;
  quote: QuoteDetail;
  // Vuelve a pedir la ficha y da el servicio como quedó.
  reloadItem: (itemId: number) => () => Promise<{ data?: QuoteItem }>;
  onSaved: (text: string) => void;
  onClose: () => void;
};

// Si otra persona envió la cotización mientras se escribía, la API lo rechaza: se dice arriba
// y lo escrito se queda.
function useNotEditable() {
  const [message, setMessage] = useState<string>();
  const guard = async (send: () => Promise<unknown>) => {
    setMessage(undefined);
    try {
      await send();
      return true;
    } catch (error) {
      if (!isApiError(error) || error.code !== 'quote_not_editable')
        throw error;
      setMessage(error.message);
      return false;
    }
  };
  return { message, guard };
}

function CreateItem({
  quote,
  onSaved,
  onClose,
}: Omit<QuoteItemPanelProps, 'state' | 'reloadItem'>) {
  const addItem = useAddQuoteItem(quote.id);
  const { message, guard } = useNotEditable();
  const submit = async (payload: ItemPayload) => {
    if (await guard(() => addItem.mutateAsync(payload)))
      onSaved('Servicio agregado.');
  };
  return (
    <QuoteItemForm
      defaultValues={emptyItemForm(quote)}
      alternatives={alternativeChoices(quote)}
      onSubmit={submit}
      onCancel={onClose}
      notices={message && <Alert title={message} />}
    />
  );
}

function EditItem({
  quote,
  item,
  reloadItem,
  onSaved,
  onClose,
}: Omit<QuoteItemPanelProps, 'state' | 'reloadItem'> & {
  item: QuoteItem;
  reloadItem: () => Promise<{ data?: QuoteItem }>;
}) {
  const updateItem = useUpdateQuoteItem(quote.id);
  const { message, guard } = useNotEditable();
  const { opened, stale, reloading, save, reload } = useVersionedEdit(
    item,
    reloadItem,
  );

  const submit = async (payload: ItemPayload) => {
    let saved = false;
    const allowed = await guard(async () => {
      saved = await save((version) =>
        updateItem.mutateAsync({
          itemId: item.id,
          body: { ...payload, expected_version: version },
        }),
      );
    });
    if (allowed && saved) onSaved('Servicio actualizado.');
  };

  return (
    // La clave cambia con la versión: al recargar, el formulario se arma con el servicio nuevo.
    <QuoteItemForm
      key={opened.version}
      defaultValues={itemFormValues(opened)}
      alternatives={alternativeChoices(quote, item.id)}
      onSubmit={submit}
      onCancel={onClose}
      notices={
        <>
          {stale && (
            <StaleVersionNotice
              message={stale}
              onReload={() => void reload()}
              reloading={reloading}
            />
          )}
          {message && <Alert title={message} />}
        </>
      }
    />
  );
}

// El formulario de un servicio, junto a la tabla: alta o edición del que se eligió.
export function QuoteItemPanel({
  state,
  quote,
  reloadItem,
  onSaved,
  onClose,
}: QuoteItemPanelProps) {
  return (
    <aside
      aria-labelledby="item-panel-title"
      className="flex flex-col gap-4 border-t px-5 py-5 lg:border-t-0 lg:border-l"
    >
      <h3
        id="item-panel-title"
        className="font-heading text-base font-semibold"
      >
        {state.mode === 'create' ? 'Nuevo servicio' : 'Editar servicio'}
      </h3>
      {state.mode === 'create' ? (
        <CreateItem quote={quote} onSaved={onSaved} onClose={onClose} />
      ) : (
        <EditItem
          key={state.item.id}
          quote={quote}
          item={state.item}
          reloadItem={reloadItem(state.item.id)}
          onSaved={onSaved}
          onClose={onClose}
        />
      )}
    </aside>
  );
}

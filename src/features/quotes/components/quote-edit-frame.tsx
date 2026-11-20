'use client';

import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';

import { Alert } from '@/components/alert';
import { ButtonLink } from '@/components/button-link';
import { PageHeader } from '@/components/page-header';
import { StaleVersionNotice } from '@/components/stale-version-notice';
import { isApiError } from '@/lib/api/errors';
import { setPageNotice } from '@/lib/page-notice';
import { parseRouteId } from '@/lib/route-id';
import { useVersionedEdit } from '@/lib/use-versioned-edit';

import { useQuote, type QuoteDetail } from '../api';
import { quoteNoticeTarget } from '../format';
import { QuoteLoader } from './quote-loader';

// Mismo texto que la API.
const NOT_EDITABLE =
  'Solo se edita una cotización en borrador. Devuélvela a borrador para cambiarla.';

type EditorProps = {
  quote: QuoteDetail;
  // Envía con la versión de apertura; si otra persona guardó antes, avisa sin borrar lo
  // escrito. Al terminar vuelve a la ficha con el aviso.
  save: (send: (version: number) => Promise<unknown>) => Promise<void>;
  notices: ReactNode;
};

function Editor({
  quote,
  title,
  render,
}: {
  quote: QuoteDetail;
  title: string;
  render: (props: EditorProps) => ReactNode;
}) {
  const router = useRouter();
  const query = useQuote(quote.id);
  const versioned = useVersionedEdit(quote, query.refetch);
  const [notEditable, setNotEditable] = useState<string>();

  const save = async (send: (version: number) => Promise<unknown>) => {
    setNotEditable(undefined);
    try {
      if (!(await versioned.save(send))) return;
    } catch (error) {
      if (isApiError(error) && error.code === 'quote_not_editable') {
        setNotEditable(error.message);
        return;
      }
      throw error;
    }
    setPageNotice({
      target: quoteNoticeTarget(quote.id),
      text: 'Cambios guardados.',
    });
    router.push(`/cotizaciones/${quote.id}`);
  };

  return (
    <div className="flex max-w-3xl flex-col gap-7">
      <PageHeader eyebrow="Operación / 06" title={`${title} · ${quote.code}`} />
      {render({
        quote: versioned.opened,
        save,
        notices: (
          <>
            {versioned.stale && (
              <StaleVersionNotice
                message={versioned.stale}
                onReload={() => void versioned.reload()}
                reloading={versioned.reloading}
              />
            )}
            {notEditable && <Alert title={notEditable} />}
          </>
        ),
      })}
    </div>
  );
}

// El marco de las dos pantallas de edición (datos generales y condiciones): carga la
// cotización y, si ya no es borrador, explica por qué no se puede editar.
export function QuoteEditFrame({
  id,
  title,
  render,
}: {
  id: string;
  title: string;
  render: (props: EditorProps) => ReactNode;
}) {
  const quoteId = parseRouteId(id);
  return (
    <QuoteLoader
      quoteId={quoteId}
      back={{ href: `/cotizaciones/${id}`, label: 'Volver a la ficha' }}
    >
      {(quote) =>
        quote.status !== 'draft' ? (
          <div className="flex max-w-3xl flex-col gap-5">
            <PageHeader
              eyebrow="Operación / 06"
              title={`${title} · ${quote.code}`}
            />
            <Alert variant="info" title={NOT_EDITABLE} />
            <div>
              <ButtonLink href={`/cotizaciones/${quote.id}`} variant="outline">
                Ir a la ficha
              </ButtonLink>
            </div>
          </div>
        ) : (
          <Editor quote={quote} title={title} render={render} />
        )
      }
    </QuoteLoader>
  );
}

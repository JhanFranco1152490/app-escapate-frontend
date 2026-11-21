'use client';

import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';

import { Alert } from '@/components/alert';
import { ButtonLink } from '@/components/button-link';
import { DetailItem } from '@/components/detail-item';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { RecordLoader } from '@/components/record-loader';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { useHasPermission } from '@/features/auth/permissions';
import { formatMoney } from '@/lib/format/money';
import { parseRouteId } from '@/lib/route-id';

import type { QuoteItem } from '../api';
import { emptyItemForm, itemFormValues } from '../form-values';
import {
  useAddPackageItem,
  usePackage,
  useRemovePackageItem,
  useUpdatePackage,
  useUpdatePackageItem,
  type PackageDetail,
} from '../package-api';
import type { ItemPayload } from '../schemas';
import { PackageGeneralForm } from './package-general-form';
import { QuoteItemForm } from './quote-item-form';
import { QuoteItemsTable } from './quote-items-table';

type Panel = { mode: 'create' } | { mode: 'edit'; item: QuoteItem };

function PackageItems({ data }: { data: PackageDetail }) {
  const canManage = useHasPermission('quotes.manage');
  const [panel, setPanel] = useState<Panel>();
  const [feedback, setFeedback] = useState<string>();
  const add = useAddPackageItem(data.id);
  const update = useUpdatePackageItem(data.id);
  const remove = useRemovePackageItem(data.id);

  const save = async (payload: ItemPayload) => {
    if (panel?.mode === 'edit') {
      await update.mutateAsync({
        itemId: panel.item.id,
        body: { ...payload, expected_version: panel.item.version },
      });
      setFeedback('Servicio actualizado.');
    } else {
      await add.mutateAsync(payload);
      setFeedback('Servicio agregado.');
    }
    setPanel(undefined);
  };

  return (
    <section className="rounded-md border bg-card" aria-label="Servicios">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <h2 className="font-heading text-lg font-semibold">Servicios</h2>
        {canManage && (
          <Button
            variant="outline"
            onClick={() => setPanel({ mode: 'create' })}
          >
            <Plus aria-hidden="true" />
            Agregar servicio
          </Button>
        )}
      </header>
      {feedback && (
        <div className="px-5 pt-4">
          <Alert variant="info" title={feedback} />
        </div>
      )}
      <div
        className={
          panel ? 'grid lg:grid-cols-[minmax(0,1fr)_26rem]' : undefined
        }
      >
        <div className="min-w-0">
          {data.items.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">
              Agrega los servicios que incluye el paquete.
            </p>
          ) : (
            <QuoteItemsTable
              items={data.items}
              actions={
                canManage
                  ? (item) => (
                      <div className="flex gap-2 md:justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={`Editar ${item.name}`}
                          onClick={() => setPanel({ mode: 'edit', item })}
                        >
                          <Pencil aria-hidden="true" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={remove.isPending}
                          aria-label={`Quitar ${item.name}`}
                          onClick={() =>
                            remove.mutate(item.id, {
                              onSuccess: () => setFeedback('Servicio quitado.'),
                            })
                          }
                        >
                          Quitar
                        </Button>
                      </div>
                    )
                  : undefined
              }
            />
          )}
        </div>
        {panel && (
          <aside className="flex flex-col gap-4 border-t px-5 py-5 lg:border-t-0 lg:border-l">
            <h3 className="font-heading text-base font-semibold">
              {panel.mode === 'create' ? 'Nuevo servicio' : 'Editar servicio'}
            </h3>
            <QuoteItemForm
              key={panel.mode === 'edit' ? panel.item.id : 'new'}
              defaultValues={
                panel.mode === 'edit'
                  ? itemFormValues(panel.item)
                  : emptyItemForm(data)
              }
              alternatives={[]}
              onSubmit={save}
              onCancel={() => setPanel(undefined)}
            />
          </aside>
        )}
      </div>
      <dl className="grid gap-5 border-t px-5 py-5 sm:grid-cols-3">
        <DetailItem term="Precio del paquete">
          <span className="text-base font-semibold">
            {formatMoney(data.totals.sale)}
          </span>
        </DetailItem>
        <DetailItem term={`Por persona (${data.reference_travelers})`}>
          {data.totals.per_person === null
            ? '—'
            : formatMoney(data.totals.per_person)}
        </DetailItem>
        <DetailItem term="Ganancia">
          {formatMoney(data.totals.profit)}
        </DetailItem>
      </dl>
    </section>
  );
}

export function PackageDetailScreen({ id }: { id: string }) {
  const packageId = parseRouteId(id);
  const canManage = useHasPermission('quotes.manage');
  const [editing, setEditing] = useState(false);
  const update = useUpdatePackage(packageId ?? 0);

  return (
    <RecordLoader
      validId={packageId !== null}
      query={usePackage(packageId)}
      back={{ href: '/paquetes', label: 'Paquetes' }}
      notFound={
        <EmptyState
          title="No encontramos este paquete"
          action={
            <ButtonLink href="/paquetes" variant="outline">
              Volver a paquetes
            </ButtonLink>
          }
        >
          Puede que el enlace esté mal escrito.
        </EmptyState>
      }
      errorTitle="No pudimos cargar el paquete"
      loadingLabel="Cargando el paquete"
    >
      {(data) => (
        <>
          <PageHeader
            eyebrow="Oferta turística / 04"
            title={data.name}
            description={`${data.code} · ${data.destination} · ${data.nights} noches`}
            actions={
              canManage &&
              !editing && (
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <Pencil aria-hidden="true" />
                  Editar datos
                </Button>
              )
            }
          />
          <div>
            <StatusBadge
              label={data.is_active ? 'Activo' : 'Inactivo'}
              tone={data.is_active ? 'ok' : 'inactive'}
            />
          </div>
          {editing ? (
            <section className="rounded-md border bg-card px-5 py-5">
              <PackageGeneralForm
                key={data.version}
                initial={data}
                submitLabel="Guardar cambios"
                pending={update.isPending}
                onCancel={() => setEditing(false)}
                onSubmit={async (body) => {
                  await update.mutateAsync({
                    ...body,
                    expected_version: data.version,
                  });
                  setEditing(false);
                }}
              />
            </section>
          ) : (
            data.description && (
              <p className="max-w-3xl text-sm whitespace-pre-line">
                {data.description}
              </p>
            )
          )}
          <PackageItems data={data} />
        </>
      )}
    </RecordLoader>
  );
}

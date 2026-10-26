'use client';

import { useRouter } from 'next/navigation';

import { PageHeader } from '@/components/page-header';
import { StaleVersionNotice } from '@/components/stale-version-notice';
import { setPageNotice } from '@/lib/page-notice';
import { useVersionedEdit } from '@/lib/use-versioned-edit';

import { useClient, useUpdateClient, type ClientDetail } from '../api';
import { clientNoticeTarget } from '../client-notice';
import { clientFormValues } from '../form-values';
import type { ClientPayload } from '../schemas';
import { ClientForm } from './client-form';

export function EditClientForm({ client }: { client: ClientDetail }) {
  const router = useRouter();
  const updateClient = useUpdateClient(client.id);
  const query = useClient(client.id);
  const { opened, stale, reloading, save, reload } = useVersionedEdit(
    client,
    query.refetch,
  );

  const submit = async (payload: ClientPayload) => {
    const saved = await save((version) =>
      updateClient.mutateAsync({ ...payload, expected_version: version }),
    );
    if (!saved) return;
    setPageNotice({
      target: clientNoticeTarget(client.id),
      text: 'Cambios guardados.',
    });
    router.push(`/clientes/${client.id}`);
  };

  return (
    <div className="flex max-w-3xl flex-col gap-7">
      <PageHeader
        eyebrow="Operación / 02"
        title="Editar cliente"
        description={`Corrige los datos de ${client.display_name}. Su ficha de viajero, si la tiene, no cambia.`}
      />
      {/* La clave cambia con la versión: al recargar, el formulario vuelve a armarse con la
          ficha nueva en vez de mezclarla con lo escrito. */}
      <ClientForm
        key={opened.version}
        mode="edit"
        defaultValues={clientFormValues(opened)}
        submitLabel="Guardar cambios"
        cancelHref={`/clientes/${client.id}`}
        onSubmit={submit}
        notices={
          stale && (
            <StaleVersionNotice
              message={stale}
              onReload={() => void reload()}
              reloading={reloading}
            />
          )
        }
      />
    </div>
  );
}

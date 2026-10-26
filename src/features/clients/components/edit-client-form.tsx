'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { PageHeader } from '@/components/page-header';
import { StaleVersionNotice } from '@/components/stale-version-notice';
import { isStaleVersion } from '@/lib/api/errors';
import { setPageNotice } from '@/lib/page-notice';

import { useClient, useUpdateClient, type ClientDetail } from '../api';
import { clientNoticeTarget } from '../client-notice';
import { clientFormValues } from '../form-values';
import type { ClientPayload } from '../schemas';
import { ClientForm } from './client-form';

export function EditClientForm({ client }: { client: ClientDetail }) {
  const router = useRouter();
  const updateClient = useUpdateClient(client.id);
  const query = useClient(client.id);
  // La ficha con la que se abrió el formulario: su versión es la que se envía, aunque la
  // consulta traiga después una más nueva. Así, si otra persona guardó en el medio, la API lo
  // detecta en vez de pisar sus cambios.
  const [opened, setOpened] = useState(client);
  const [stale, setStale] = useState<string>();
  const [reloading, setReloading] = useState(false);

  const submit = async (payload: ClientPayload) => {
    setStale(undefined);
    try {
      await updateClient.mutateAsync({
        ...payload,
        expected_version: opened.version,
      });
    } catch (error) {
      // Lo escrito se queda en el formulario hasta que la persona decida recargar.
      if (isStaleVersion(error)) {
        setStale((error as Error).message);
        return;
      }
      throw error;
    }
    setPageNotice({
      target: clientNoticeTarget(client.id),
      text: 'Cambios guardados.',
    });
    router.push(`/clientes/${client.id}`);
  };

  const reload = async () => {
    setReloading(true);
    const { data } = await query.refetch();
    setReloading(false);
    if (!data) return;
    setOpened(data);
    setStale(undefined);
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

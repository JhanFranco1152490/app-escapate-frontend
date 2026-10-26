'use client';

import { useRouter } from 'next/navigation';

import { PageHeader } from '@/components/page-header';
import { StaleVersionNotice } from '@/components/stale-version-notice';
import { setPageNotice } from '@/lib/page-notice';
import { useVersionedEdit } from '@/lib/use-versioned-edit';

import { useTraveler, useUpdateTraveler, type TravelerDetail } from '../api';
import { travelerFormValues } from '../form-values';
import type { TravelerPayload } from '../schemas';
import { travelerNoticeTarget } from '../traveler-notice';
import { TravelerForm } from './traveler-form';

export function EditTravelerForm({ traveler }: { traveler: TravelerDetail }) {
  const router = useRouter();
  const updateTraveler = useUpdateTraveler(traveler.id);
  const query = useTraveler(traveler.id);
  const { opened, stale, reloading, save, reload } = useVersionedEdit(
    traveler,
    query.refetch,
  );

  const submit = async (payload: TravelerPayload) => {
    const saved = await save((version) =>
      updateTraveler.mutateAsync({ ...payload, expected_version: version }),
    );
    if (!saved) return;
    setPageNotice({
      target: travelerNoticeTarget(traveler.id),
      text: 'Cambios guardados.',
    });
    router.push(`/viajeros/${traveler.id}`);
  };

  return (
    <div className="flex max-w-3xl flex-col gap-7">
      <PageHeader
        eyebrow="Operación / 03"
        title="Editar viajero"
        description={`Corrige los datos de ${traveler.full_name}. Su ficha de cliente, si la tiene, no cambia.`}
      />
      {/* La clave cambia con la versión: al recargar, el formulario vuelve a armarse con la
          ficha nueva en vez de mezclarla con lo escrito. */}
      <TravelerForm
        key={opened.version}
        mode="edit"
        defaultValues={travelerFormValues(opened)}
        submitLabel="Guardar cambios"
        cancelHref={`/viajeros/${traveler.id}`}
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

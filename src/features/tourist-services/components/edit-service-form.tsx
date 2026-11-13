'use client';

import { useRouter } from 'next/navigation';

import { PageHeader } from '@/components/page-header';
import { StaleVersionNotice } from '@/components/stale-version-notice';
import { setPageNotice } from '@/lib/page-notice';
import { useVersionedEdit } from '@/lib/use-versioned-edit';

import {
  useTouristService,
  useUpdateTouristService,
  type TouristServiceDetail,
} from '../api';
import { serviceFormValues } from '../form-values';
import type { ServicePayload } from '../schemas';
import { serviceNoticeTarget } from '../service-notice';
import { TouristServiceForm } from './tourist-service-form';

export function EditServiceForm({
  service,
}: {
  service: TouristServiceDetail;
}) {
  const router = useRouter();
  const updateService = useUpdateTouristService(service.id);
  const query = useTouristService(service.id);
  const { opened, stale, reloading, save, reload } = useVersionedEdit(
    service,
    query.refetch,
  );

  // El cuerpo lleva el tipo actual: con él la API elige cómo validar los atributos.
  const submit = async (payload: ServicePayload) => {
    const saved = await save((version) =>
      updateService.mutateAsync({ ...payload, expected_version: version }),
    );
    if (!saved) return;
    setPageNotice({
      target: serviceNoticeTarget(service.id),
      text: 'Cambios guardados.',
    });
    router.push(`/servicios/${service.id}`);
  };

  return (
    <div className="flex max-w-3xl flex-col gap-7">
      <PageHeader
        eyebrow="Oferta turística / 02"
        title="Editar servicio"
        description={`Corrige los datos de ${service.name}. El estado se cambia desde su ficha.`}
      />
      {/* La clave cambia con la versión: al recargar, el formulario vuelve a armarse con la
          ficha nueva en vez de mezclarla con lo escrito. */}
      <TouristServiceForm
        key={opened.version}
        mode="edit"
        supplierName={opened.supplier.trade_name}
        serviceTypes={[opened.service_type]}
        defaultValues={serviceFormValues(opened)}
        submitLabel="Guardar cambios"
        cancelHref={`/servicios/${service.id}`}
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

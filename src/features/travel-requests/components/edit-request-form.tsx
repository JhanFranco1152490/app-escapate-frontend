'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Alert } from '@/components/alert';
import { PageHeader } from '@/components/page-header';
import { StaleVersionNotice } from '@/components/stale-version-notice';
import { isApiError } from '@/lib/api/errors';
import { setPageNotice } from '@/lib/page-notice';
import { useVersionedEdit } from '@/lib/use-versioned-edit';

import { useTravelRequest, type TravelRequestDetail } from '../api';
import { requestFormValues } from '../form-values';
import { useUpdateTravelRequest } from '../mutations';
import { requestNoticeTarget } from '../request-notice';
import type { RequestPayload } from '../schemas';
import { RequestForm } from './request-form';

export function EditRequestForm({ request }: { request: TravelRequestDetail }) {
  const router = useRouter();
  const updateRequest = useUpdateTravelRequest(request.id);
  const query = useTravelRequest(request.id);
  const { opened, stale, reloading, save, reload } = useVersionedEdit(
    request,
    query.refetch,
  );
  // Otra persona la cerró mientras se editaba: se dice arriba, sin borrar lo escrito.
  const [closed, setClosed] = useState<string>();

  const submit = async (payload: RequestPayload) => {
    setClosed(undefined);
    try {
      const saved = await save((version) =>
        updateRequest.mutateAsync({ ...payload, expected_version: version }),
      );
      if (!saved) return;
    } catch (error) {
      if (isApiError(error) && error.code === 'travel_request_closed') {
        setClosed(error.message);
        return;
      }
      throw error;
    }
    setPageNotice({
      target: requestNoticeTarget(request.id),
      text: 'Cambios guardados.',
    });
    router.push(`/solicitudes/${request.id}`);
  };

  return (
    <div className="flex max-w-3xl flex-col gap-7">
      <PageHeader
        eyebrow="Operación / 04"
        title={`Editar solicitud ${request.code}`}
        description={`De ${request.client.display_name}. Editar no cambia su estado.`}
      />
      {/* La clave cambia con la versión: al recargar, el formulario vuelve a armarse con la
          solicitud nueva en vez de mezclarla con lo escrito. */}
      <RequestForm
        key={opened.version}
        mode="edit"
        defaultValues={requestFormValues(opened)}
        original={{
          departure_date: opened.departure_date,
          window_end: opened.window_end,
        }}
        currentAdvisor={opened.assigned_to}
        submitLabel="Guardar cambios"
        cancelHref={`/solicitudes/${request.id}`}
        onSubmit={submit}
        notices={
          <>
            {stale && (
              <StaleVersionNotice
                message={stale}
                onReload={() => void reload()}
                reloading={reloading}
              />
            )}
            {closed && <Alert title={closed} />}
          </>
        }
      />
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Alert } from '@/components/alert';
import { ButtonLink } from '@/components/button-link';
import { PageHeader } from '@/components/page-header';
import type { SupplierDetail } from '@/features/suppliers/api';
import { SupplierLoader } from '@/features/suppliers/components/supplier-loader';
import { isApiError } from '@/lib/api/errors';
import { setPageNotice } from '@/lib/page-notice';
import { parseRouteId } from '@/lib/route-id';

import { useCreateTouristService } from '../api';
import { emptyServiceForm } from '../form-values';
import type { ServicePayload } from '../schemas';
import { serviceNoticeTarget } from '../service-notice';
import { TouristServiceForm } from './tourist-service-form';

function NewServiceForm({ supplier }: { supplier: SupplierDetail }) {
  const router = useRouter();
  const createService = useCreateTouristService(supplier.id);
  // Si desactivan al proveedor mientras se escribe, la API lo rechaza: se dice arriba y lo
  // escrito se queda.
  const [conflict, setConflict] = useState<string>();

  const submit = async (payload: ServicePayload) => {
    setConflict(undefined);
    try {
      const service = await createService.mutateAsync(payload);
      setPageNotice({
        target: serviceNoticeTarget(service.id),
        text: 'Servicio registrado.',
      });
      router.push(`/servicios/${service.id}`);
    } catch (error) {
      if (!isApiError(error) || error.code !== 'supplier_inactive') throw error;
      setConflict(error.message);
    }
  };

  return (
    <TouristServiceForm
      mode="create"
      supplierName={supplier.trade_name}
      serviceTypes={supplier.categories}
      defaultValues={emptyServiceForm(supplier.categories)}
      submitLabel="Guardar servicio"
      cancelHref={`/proveedores/${supplier.id}`}
      onSubmit={submit}
      notices={conflict && <Alert title={conflict} />}
    />
  );
}

export function CreateServiceScreen({ supplierId }: { supplierId: string }) {
  const id = parseRouteId(supplierId);

  return (
    <SupplierLoader
      supplierId={id}
      back={{
        href: `/proveedores/${supplierId}`,
        label: 'Volver al proveedor',
      }}
    >
      {(supplier) => (
        <div className="flex max-w-3xl flex-col gap-7">
          <PageHeader
            eyebrow="Oferta turística / 02"
            title="Nuevo servicio"
            description="Elige el tipo de servicio y el formulario muestra los campos que le corresponden."
          />
          {supplier.is_active ? (
            <NewServiceForm supplier={supplier} />
          ) : (
            <Alert
              variant="info"
              title="Activa el proveedor para registrarle servicios nuevos."
            >
              <p>
                {supplier.trade_name} está inactivo. Cuando lo actives podrás
                volver aquí.
              </p>
              <ButtonLink
                href={`/proveedores/${supplier.id}`}
                variant="outline"
                className="mt-3"
              >
                Ir a la ficha del proveedor
              </ButtonLink>
            </Alert>
          )}
        </div>
      )}
    </SupplierLoader>
  );
}

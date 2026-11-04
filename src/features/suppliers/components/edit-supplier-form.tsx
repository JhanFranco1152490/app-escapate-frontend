'use client';

import { useRouter } from 'next/navigation';

import { PageHeader } from '@/components/page-header';
import { StaleVersionNotice } from '@/components/stale-version-notice';
import { setPageNotice } from '@/lib/page-notice';
import { useVersionedEdit } from '@/lib/use-versioned-edit';

import { useSupplier, useUpdateSupplier, type SupplierDetail } from '../api';
import { supplierFormValues } from '../form-values';
import type { SupplierPayload } from '../schemas';
import { supplierNoticeTarget } from '../supplier-notice';
import { SupplierForm } from './supplier-form';

export function EditSupplierForm({ supplier }: { supplier: SupplierDetail }) {
  const router = useRouter();
  const updateSupplier = useUpdateSupplier(supplier.id);
  const query = useSupplier(supplier.id);
  const { opened, stale, reloading, save, reload } = useVersionedEdit(
    supplier,
    query.refetch,
  );

  const submit = async (payload: SupplierPayload) => {
    const saved = await save((version) =>
      updateSupplier.mutateAsync({ ...payload, expected_version: version }),
    );
    if (!saved) return;
    setPageNotice({
      target: supplierNoticeTarget(supplier.id),
      text: 'Cambios guardados.',
    });
    router.push(`/proveedores/${supplier.id}`);
  };

  return (
    <div className="flex max-w-3xl flex-col gap-7">
      <PageHeader
        eyebrow="Oferta turística / 02"
        title="Editar proveedor"
        description={`Corrige los datos de ${supplier.trade_name}. El estado se cambia desde su ficha.`}
      />
      {/* La clave cambia con la versión: al recargar, el formulario vuelve a armarse con la
          ficha nueva en vez de mezclarla con lo escrito. */}
      <SupplierForm
        key={opened.version}
        defaultValues={supplierFormValues(opened)}
        submitLabel="Guardar cambios"
        cancelHref={`/proveedores/${supplier.id}`}
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

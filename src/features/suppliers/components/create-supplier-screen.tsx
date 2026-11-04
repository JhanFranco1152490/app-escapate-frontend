'use client';

import { useRouter } from 'next/navigation';

import { PageHeader } from '@/components/page-header';
import { setPageNotice } from '@/lib/page-notice';

import { useCreateSupplier } from '../api';
import { EMPTY_SUPPLIER_FORM } from '../form-values';
import type { SupplierPayload } from '../schemas';
import { supplierNoticeTarget } from '../supplier-notice';
import { SupplierForm } from './supplier-form';

export function CreateSupplierScreen() {
  const router = useRouter();
  const createSupplier = useCreateSupplier();

  const submit = async (payload: SupplierPayload) => {
    const supplier = await createSupplier.mutateAsync(payload);
    setPageNotice({
      target: supplierNoticeTarget(supplier.id),
      text: 'Proveedor registrado.',
    });
    router.push(`/proveedores/${supplier.id}`);
  };

  return (
    <div className="flex max-w-3xl flex-col gap-7">
      <PageHeader
        eyebrow="Oferta turística / 02"
        title="Nuevo proveedor"
        description="Datos de contacto, clasificación e información comercial para trabajar con él."
      />
      <SupplierForm
        defaultValues={EMPTY_SUPPLIER_FORM}
        submitLabel="Guardar proveedor"
        cancelHref="/proveedores"
        onSubmit={submit}
      />
    </div>
  );
}

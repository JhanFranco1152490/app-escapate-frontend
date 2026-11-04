'use client';

import type { ReactNode } from 'react';

import { ButtonLink } from '@/components/button-link';
import { EmptyState } from '@/components/empty-state';
import { RecordLoader } from '@/components/record-loader';

import { useSupplier, type SupplierDetail } from '../api';

type SupplierLoaderProps = {
  // null si el id de la URL es imposible: no se pide a la API.
  supplierId: number | null;
  back: { href: string; label: string };
  children: (supplier: SupplierDetail) => ReactNode;
};

function SupplierNotFound() {
  return (
    <EmptyState
      title="No encontramos este proveedor"
      action={
        <ButtonLink href="/proveedores" variant="outline">
          Volver a proveedores
        </ButtonLink>
      }
    >
      Puede que el enlace esté mal escrito. Búscalo en la lista de proveedores.
    </EmptyState>
  );
}

export function SupplierLoader({
  supplierId,
  back,
  children,
}: SupplierLoaderProps) {
  return (
    <RecordLoader
      validId={supplierId !== null}
      query={useSupplier(supplierId)}
      back={back}
      notFound={<SupplierNotFound />}
      errorTitle="No pudimos cargar el proveedor"
      loadingLabel="Cargando el proveedor"
    >
      {children}
    </RecordLoader>
  );
}

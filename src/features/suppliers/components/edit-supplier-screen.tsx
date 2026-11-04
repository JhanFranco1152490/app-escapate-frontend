'use client';

import { parseRouteId } from '@/lib/route-id';

import { EditSupplierForm } from './edit-supplier-form';
import { SupplierLoader } from './supplier-loader';

export function EditSupplierScreen({ id }: { id: string }) {
  return (
    <SupplierLoader
      supplierId={parseRouteId(id)}
      back={{ href: `/proveedores/${id}`, label: 'Volver a la ficha' }}
    >
      {(supplier) => <EditSupplierForm supplier={supplier} />}
    </SupplierLoader>
  );
}

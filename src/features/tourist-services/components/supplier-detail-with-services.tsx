'use client';

import { SupplierDetailScreen } from '@/features/suppliers/components/supplier-detail-screen';

import { SupplierServicesSection } from './supplier-services-section';

// La ficha del proveedor con sus servicios debajo. Arma las dos piezas aquí, y no en la
// página, porque la sección necesita el proveedor ya cargado y una página del servidor no
// puede pasarle una función a la ficha. Así proveedores no importa nada de servicios.
export function SupplierDetailWithServices({ id }: { id: string }) {
  return (
    <SupplierDetailScreen
      id={id}
      services={(supplier) => <SupplierServicesSection supplier={supplier} />}
    />
  );
}

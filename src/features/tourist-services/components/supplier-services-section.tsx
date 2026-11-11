'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { ButtonLink } from '@/components/button-link';
import { Pagination } from '@/components/pagination';
import { Tag } from '@/components/tag';
import { Skeleton } from '@/components/ui/skeleton';
import { useHasPermission } from '@/features/auth/permissions';
import type { SupplierDetail } from '@/features/suppliers/api';
import { SUPPLIER_CATEGORY_LABELS } from '@/features/suppliers/categories';
import { SupplierStatusBadge } from '@/features/suppliers/components/supplier-status-badge';

import { SERVICES_PAGE_SIZE, useSupplierServices } from '../api';

const muted = 'px-5 py-4 text-sm text-muted-foreground';

const currentRates = (count: number) =>
  count === 0
    ? 'Sin tarifas vigentes'
    : count === 1
      ? '1 tarifa vigente'
      : `${count} tarifas vigentes`;

// Los servicios del proveedor, en su ficha. Solo se muestra con `tourist_services.view`, y sin
// ese permiso tampoco se piden.
export function SupplierServicesSection({
  supplier,
}: {
  supplier: Pick<SupplierDetail, 'id' | 'is_active'>;
}) {
  const canView = useHasPermission('tourist_services.view');
  const canManage = useHasPermission('tourist_services.manage');
  const [page, setPage] = useState(1);
  const services = useSupplierServices(supplier.id, page, {
    enabled: canView,
  });
  if (!canView) return null;

  const data = services.data;
  const newService = canManage && supplier.is_active && (
    <ButtonLink
      href={`/proveedores/${supplier.id}/servicios/nuevo`}
      variant="outline"
      size="sm"
    >
      <Plus aria-hidden="true" />
      Nuevo servicio
    </ButtonLink>
  );

  return (
    <section
      aria-labelledby="supplier-services-title"
      className="rounded-md border bg-card"
    >
      <header className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2
          id="supplier-services-title"
          className="font-heading text-lg font-semibold"
        >
          Servicios
        </h2>
        {newService}
      </header>
      {canManage && !supplier.is_active && (
        <p className={`${muted} border-b`}>
          Activa el proveedor para registrarle servicios nuevos.
        </p>
      )}
      {services.isError ? (
        <p className={muted}>
          No pudimos cargar sus servicios.{' '}
          <button
            type="button"
            onClick={() => void services.refetch()}
            className="underline underline-offset-4"
          >
            Reintentar
          </button>
        </p>
      ) : !data ? (
        <div
          role="status"
          aria-label="Cargando sus servicios"
          className="px-5 py-4"
        >
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
      ) : data.results.length === 0 ? (
        <p className={muted}>
          Este proveedor aún no tiene servicios registrados.
        </p>
      ) : (
        <ul className="divide-y">
          {data.results.map((service) => (
            <li
              key={service.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3 text-sm"
            >
              <Link
                href={`/servicios/${service.id}`}
                className="min-w-0 font-medium underline-offset-4 hover:underline"
              >
                {service.name}
              </Link>
              <Tag>{SUPPLIER_CATEGORY_LABELS[service.service_type]}</Tag>
              <span className="text-muted-foreground">
                {service.destination}
              </span>
              <span className="font-mono text-[0.75rem] text-muted-foreground">
                {currentRates(service.current_rate_count)}
              </span>
              <span className="flex items-center gap-4 sm:ml-auto">
                <SupplierStatusBadge active={service.is_active} />
                {/* El nombre ya enlaza a la ficha: este botón repite el destino para quien
                    recorre la fila con el ratón, sin sumar otra parada al teclado. */}
                <ButtonLink
                  href={`/servicios/${service.id}`}
                  variant="outline"
                  size="sm"
                  tabIndex={-1}
                  aria-hidden="true"
                  className="max-sm:hidden"
                >
                  Abrir
                </ButtonLink>
              </span>
            </li>
          ))}
        </ul>
      )}
      {data && data.count > SERVICES_PAGE_SIZE && (
        <Pagination
          page={page}
          pageSize={SERVICES_PAGE_SIZE}
          count={data.count}
          hasPrevious={data.previous !== null}
          hasNext={data.next !== null}
          onPageChange={setPage}
        />
      )}
    </section>
  );
}

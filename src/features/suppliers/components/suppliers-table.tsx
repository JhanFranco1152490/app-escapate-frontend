import Link from 'next/link';

import { ButtonLink } from '@/components/button-link';
import { Tag } from '@/components/tag';
import { formatDocument } from '@/lib/format/document';
import { formatPhone } from '@/lib/format/phone';

import type { SupplierListItem } from '../api';
import { SUPPLIER_CATEGORY_LABELS } from '../categories';
import { SupplierStatusBadge } from './supplier-status-badge';

const headerCell =
  'h-10.5 px-4 text-left font-mono text-[0.59375rem] font-normal tracking-[0.16em] text-muted-foreground uppercase';
// Por debajo de md cada fila es una tarjeta: mismo marcado, sin una segunda copia de los
// datos para celular.
const cell = 'px-4 md:py-2';
const mono = 'font-mono text-[0.75rem]';

export function SuppliersTable({
  suppliers,
}: {
  suppliers: SupplierListItem[];
}) {
  return (
    <table className="w-full text-sm md:table-fixed">
      <colgroup className="max-md:hidden">
        <col />
        <col className="w-[22%]" />
        <col className="w-[22%]" />
        <col className="w-[12%]" />
        <col className="w-[9%]" />
        <col className="w-[11%]" />
        <col className="w-24" />
      </colgroup>
      <thead className="bg-muted/60 max-md:sr-only">
        <tr>
          <th scope="col" className={headerCell}>
            Proveedor
          </th>
          <th scope="col" className={headerCell}>
            Clasificación
          </th>
          <th scope="col" className={headerCell}>
            Contacto
          </th>
          <th scope="col" className={headerCell}>
            Ciudad
          </th>
          <th scope="col" className={headerCell}>
            Servicios
          </th>
          <th scope="col" className={headerCell}>
            Estado
          </th>
          <th scope="col" className={headerCell}>
            <span className="sr-only">Acciones</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {suppliers.map((supplier) => (
          <tr
            key={supplier.id}
            className="border-t max-md:flex max-md:flex-col max-md:gap-1.5 max-md:py-3.5 md:h-16"
          >
            <td className={`${cell} min-w-0`}>
              <Link
                href={`/proveedores/${supplier.id}`}
                className="block truncate font-medium underline-offset-4 hover:underline"
              >
                {supplier.trade_name}
              </Link>
              <span
                className={`block truncate text-[0.6875rem] text-muted-foreground ${mono}`}
              >
                {formatDocument(
                  supplier.document_type,
                  supplier.document_number,
                ) ?? 'Sin documento'}
              </span>
            </td>
            <td className={cell}>
              <div className="flex flex-wrap gap-1">
                {supplier.categories.map((category) => (
                  <Tag key={category}>{SUPPLIER_CATEGORY_LABELS[category]}</Tag>
                ))}
              </div>
            </td>
            <td className={`${cell} min-w-0`}>
              <span className="block truncate">{supplier.contact_name}</span>
              {(supplier.contact_email || supplier.contact_phone) && (
                <span
                  className={`block truncate text-[0.6875rem] text-muted-foreground ${mono}`}
                >
                  {supplier.contact_email ??
                    formatPhone(supplier.contact_phone!)}
                </span>
              )}
            </td>
            <td className={`${cell} truncate text-muted-foreground`}>
              {supplier.city ?? '—'}
            </td>
            <td className={`${cell} ${mono}`}>
              {/* En celular la fila es una tarjeta sin encabezados: el número solo no se
                  entendería. */}
              <span className="md:sr-only">Servicios activos: </span>
              <span>{supplier.active_service_count}</span>
            </td>
            <td className={cell}>
              <SupplierStatusBadge active={supplier.is_active} />
            </td>
            <td className="max-md:hidden md:px-3 md:text-right">
              {/* El nombre ya enlaza a la ficha: este botón repite el destino para quien
                  recorre la fila con el ratón, sin sumar otra parada al teclado. */}
              <ButtonLink
                href={`/proveedores/${supplier.id}`}
                variant="outline"
                size="sm"
                tabIndex={-1}
                aria-hidden="true"
              >
                Abrir
              </ButtonLink>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

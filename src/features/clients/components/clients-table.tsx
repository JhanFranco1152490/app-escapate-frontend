import Link from 'next/link';

import { ButtonLink } from '@/components/button-link';
import { formatDocument } from '@/lib/format/document';
import { formatPhone } from '@/lib/format/phone';

import type { ClientListItem } from '../api';

const headerCell =
  'h-10.5 px-4 text-left font-mono text-[0.59375rem] font-normal tracking-[0.16em] text-muted-foreground uppercase';
// Por debajo de md cada fila es una tarjeta: mismo marcado, sin una segunda copia de los
// datos para celular.
const cell = 'px-4 md:h-13.5 md:py-2';
const mono = 'font-mono text-[0.75rem]';

export function ClientsTable({ clients }: { clients: ClientListItem[] }) {
  return (
    <table className="w-full text-sm md:table-fixed">
      <colgroup className="max-md:hidden">
        <col />
        <col className="w-[20%]" />
        <col className="w-[16%]" />
        <col className="w-[14%]" />
        <col className="w-24" />
      </colgroup>
      <thead className="bg-muted/60 max-md:sr-only">
        <tr>
          <th scope="col" className={headerCell}>
            Cliente
          </th>
          <th scope="col" className={headerCell}>
            Documento
          </th>
          <th scope="col" className={headerCell}>
            Teléfono
          </th>
          <th scope="col" className={headerCell}>
            Ciudad
          </th>
          <th scope="col" className={headerCell}>
            <span className="sr-only">Acciones</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {clients.map((client) => (
          <tr
            key={client.id}
            className="border-t max-md:flex max-md:flex-col max-md:gap-1.5 max-md:py-3.5"
          >
            <td className={`${cell} min-w-0`}>
              <Link
                href={`/clientes/${client.id}`}
                className="block truncate font-medium underline-offset-4 hover:underline"
              >
                {client.display_name}
              </Link>
              {client.email && (
                <span className="block truncate font-mono text-[0.6875rem] text-muted-foreground">
                  {client.email}
                </span>
              )}
            </td>
            <td className={`${cell} ${mono} truncate`}>
              {formatDocument(client.document_type, client.document_number) ?? (
                <span className="text-muted-foreground">Sin documento</span>
              )}
            </td>
            <td className={`${cell} ${mono}`}>{formatPhone(client.phone)}</td>
            <td className={`${cell} truncate text-muted-foreground`}>
              {client.city ?? '—'}
            </td>
            <td className="max-md:hidden md:px-3 md:text-right">
              {/* El nombre ya enlaza a la ficha: este botón repite el destino para quien
                  recorre la fila con el ratón, sin sumar otra parada al teclado. */}
              <ButtonLink
                href={`/clientes/${client.id}`}
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

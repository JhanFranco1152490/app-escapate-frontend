import Link from 'next/link';

import type { TravelRequestListItem } from '../api';
import { formatDeparture, formatWaiting } from '../format';
import { OpenRequestLink } from './open-request-link';
import { RequestStatusBadge } from './request-status-badge';

const headerCell =
  'h-10.5 px-4 text-left font-mono text-[0.59375rem] font-normal tracking-[0.16em] text-muted-foreground uppercase';
// Por debajo de md cada fila es una tarjeta: mismo marcado, sin una segunda copia de los
// datos para celular.
const cell = 'px-4 md:h-13.5 md:py-2';

const HEADERS = [
  'Solicitud',
  'Cliente',
  'Destino',
  'Salida',
  'Estado',
  'Espera',
];

// Las pendientes en el orden que da la API: la que más espera, primero.
export function PendingTable({
  requests,
}: {
  requests: TravelRequestListItem[];
}) {
  return (
    <table className="w-full text-sm md:table-fixed">
      <colgroup className="max-md:hidden">
        <col className="w-[11%]" />
        <col />
        <col className="w-[20%]" />
        <col className="w-[15%]" />
        <col className="w-[13%]" />
        <col className="w-[9%]" />
        <col className="w-[9%]" />
      </colgroup>
      <thead className="bg-muted/60 max-md:sr-only">
        <tr>
          {HEADERS.map((header) => (
            <th key={header} scope="col" className={headerCell}>
              {header}
            </th>
          ))}
          <th scope="col" className={headerCell}>
            <span className="sr-only">Acciones</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {requests.map((request) => (
          <tr
            key={request.id}
            className="border-t max-md:flex max-md:flex-col max-md:gap-1.5 max-md:py-3.5"
          >
            <td className={`${cell} font-mono text-[0.75rem]`}>
              <Link
                href={`/solicitudes/${request.id}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {request.code}
              </Link>
            </td>
            <td className={`${cell} min-w-0`}>
              <span className="block truncate font-medium">
                {request.client.display_name}
              </span>
              <span className="block truncate font-mono text-[0.6875rem] text-muted-foreground">
                Asesor: {request.assigned_to.full_name}
              </span>
            </td>
            <td className={`${cell} truncate`}>{request.destination}</td>
            <td className={`${cell} text-muted-foreground`}>
              {formatDeparture(request)}
            </td>
            <td className={cell}>
              <RequestStatusBadge status={request.status} />
            </td>
            <td className={`${cell} font-medium`}>
              {formatWaiting(request.waiting_days)}
            </td>
            <td className={`${cell} md:text-right`}>
              <OpenRequestLink request={request} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

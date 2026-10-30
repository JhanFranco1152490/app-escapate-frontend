import Link from 'next/link';

import { Tag } from '@/components/tag';
import { countryName } from '@/lib/countries';
import { formatLongDate } from '@/lib/format/dates';
import { formatDocument } from '@/lib/format/document';

import type { TravelerListItem } from '../api';

const headerCell =
  'h-10.5 px-4 text-left font-mono text-[0.59375rem] font-normal tracking-[0.16em] text-muted-foreground uppercase';
// Por debajo de md cada fila es una tarjeta: mismo marcado, sin una segunda copia de los
// datos para celular.
const cell = 'px-4 md:h-13.5 md:py-2';

const ageText = (age: number) => (age === 1 ? '1 año' : `${age} años`);

// Debajo del nombre: con quién viaja habitualmente, o que también es cliente.
function ReferenceLine({ traveler }: { traveler: TravelerListItem }) {
  if (traveler.is_the_client) return <>Es también cliente</>;
  if (traveler.reference_client)
    return <>Cliente: {traveler.reference_client.display_name}</>;
  return null;
}

export function TravelersTable({
  travelers,
}: {
  travelers: TravelerListItem[];
}) {
  return (
    <table className="w-full text-sm md:table-fixed">
      <colgroup className="max-md:hidden">
        <col />
        <col className="w-[19%]" />
        <col className="w-[28%]" />
        <col className="w-[16%]" />
      </colgroup>
      <thead className="bg-muted/60 max-md:sr-only">
        <tr>
          <th scope="col" className={headerCell}>
            Viajero
          </th>
          <th scope="col" className={headerCell}>
            Documento
          </th>
          <th scope="col" className={headerCell}>
            Nacimiento
          </th>
          <th scope="col" className={headerCell}>
            Nacionalidad
          </th>
        </tr>
      </thead>
      <tbody>
        {travelers.map((traveler) => (
          <tr
            key={traveler.id}
            className="border-t max-md:flex max-md:flex-col max-md:gap-1.5 max-md:py-3.5"
          >
            <td className={`${cell} min-w-0`}>
              <Link
                href={`/viajeros/${traveler.id}`}
                className="block truncate font-medium underline-offset-4 hover:underline"
              >
                {traveler.full_name}
              </Link>
              <span className="block truncate font-mono text-[0.6875rem] text-muted-foreground">
                <ReferenceLine traveler={traveler} />
              </span>
            </td>
            <td className={`${cell} truncate font-mono text-[0.75rem]`}>
              {formatDocument(traveler.document_type, traveler.document_number)}
            </td>
            <td className={cell}>
              <span className="inline-flex flex-wrap items-center gap-2">
                <span>
                  {formatLongDate(traveler.birth_date)}
                  <span className="text-muted-foreground">
                    {' · '}
                    {ageText(traveler.age)}
                  </span>
                </span>
                {traveler.is_minor && <Tag>Menor</Tag>}
              </span>
            </td>
            <td className={`${cell} truncate text-muted-foreground`}>
              {countryName(traveler.nationality)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

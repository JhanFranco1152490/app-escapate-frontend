import Link from 'next/link';

import { Tag } from '@/components/tag';
import { formatDay } from '@/lib/format/dates';
import { formatDocument } from '@/lib/format/document';

import type { RequestTraveler } from '../request-travelers-api';
import { RemoveRequestTravelerButton } from './remove-request-traveler-button';

type RequestTravelersListProps = {
  requestId: number;
  travelers: RequestTraveler[];
  // Quitar solo se ofrece a quien gestiona solicitudes y mientras la solicitud está abierta.
  canRemove: boolean;
  onRemoved: (text: string) => void;
};

const ageText = (age: number) => (age === 1 ? '1 año' : `${age} años`);

export function RequestTravelersList({
  requestId,
  travelers,
  canRemove,
  onRemoved,
}: RequestTravelersListProps) {
  return (
    <ul className="divide-y">
      {travelers.map((traveler) => (
        <li
          key={traveler.id}
          className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 text-sm"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Link
                href={`/viajeros/${traveler.id}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {traveler.full_name}
              </Link>
              <span className="font-mono text-[0.75rem] text-muted-foreground">
                {formatDocument(
                  traveler.document_type,
                  traveler.document_number,
                )}
              </span>
              <span className="text-muted-foreground">
                {ageText(traveler.age)}
              </span>
              {traveler.is_minor && <Tag>Menor</Tag>}
              {traveler.is_the_client && <Tag tone="accent">Es el cliente</Tag>}
            </span>
            <span className="font-mono text-[0.6875rem] text-muted-foreground">
              Agregado por {traveler.added_by.full_name} el{' '}
              {formatDay(traveler.added_at)}
            </span>
          </div>
          {canRemove && (
            <RemoveRequestTravelerButton
              requestId={requestId}
              traveler={traveler}
              onRemoved={onRemoved}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

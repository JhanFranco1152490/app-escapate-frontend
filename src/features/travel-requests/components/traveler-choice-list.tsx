import { Tag } from '@/components/tag';
import { formatAge } from '@/lib/format/age';
import { formatDocument } from '@/lib/format/document';

import type { TravelerListItem } from '@/features/travelers/api';

type TravelerChoiceListProps = {
  travelers: TravelerListItem[];
  selected: ReadonlySet<number>;
  // Ya están en la solicitud: se ven, pero no se vuelven a elegir.
  alreadyAdded: ReadonlySet<number>;
  // Con el tope alcanzado solo se pueden desmarcar.
  limitReached: boolean;
  onToggle: (travelerId: number) => void;
};

export function TravelerChoiceList({
  travelers,
  selected,
  alreadyAdded,
  limitReached,
  onToggle,
}: TravelerChoiceListProps) {
  return (
    <ul className="max-h-72 divide-y overflow-y-auto rounded-md border">
      {travelers.map((traveler) => {
        const added = alreadyAdded.has(traveler.id);
        const checked = selected.has(traveler.id);
        return (
          <li key={traveler.id}>
            <label className="flex min-h-11 cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm has-disabled:cursor-default has-disabled:opacity-60">
              <input
                type="checkbox"
                className="size-4 shrink-0 accent-orange-500"
                checked={checked || added}
                disabled={added || (limitReached && !checked)}
                onChange={() => onToggle(traveler.id)}
              />
              <span className="font-medium">{traveler.full_name}</span>
              <span className="font-mono text-[0.75rem] text-muted-foreground">
                {formatDocument(
                  traveler.document_type,
                  traveler.document_number,
                )}
              </span>
              <span className="text-muted-foreground">
                {formatAge(traveler.age)}
              </span>
              {traveler.is_minor && <Tag>Menor</Tag>}
              {added && <Tag>Ya está en la solicitud</Tag>}
            </label>
          </li>
        );
      })}
    </ul>
  );
}

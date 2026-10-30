'use client';

import { parseRouteId } from '@/lib/route-id';

import { EditTravelerForm } from './edit-traveler-form';
import { TravelerLoader } from './traveler-loader';

export function EditTravelerScreen({ id }: { id: string }) {
  const travelerId = parseRouteId(id);

  return (
    <TravelerLoader
      travelerId={travelerId}
      back={{ href: `/viajeros/${id}`, label: 'Volver a la ficha' }}
    >
      {(traveler) => <EditTravelerForm traveler={traveler} />}
    </TravelerLoader>
  );
}

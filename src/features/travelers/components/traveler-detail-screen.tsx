'use client';

import { Pencil } from 'lucide-react';

import { Alert } from '@/components/alert';
import { ButtonLink } from '@/components/button-link';
import { PageHeader } from '@/components/page-header';
import { useHasPermission } from '@/features/auth/permissions';
import { parseRouteId } from '@/lib/route-id';
import { usePageNotice } from '@/lib/use-page-notice';

import { travelerNoticeTarget } from '../traveler-notice';
import { TravelerDetail } from './traveler-detail';
import { TravelerLoader } from './traveler-loader';

export function TravelerDetailScreen({ id }: { id: string }) {
  const travelerId = parseRouteId(id);
  const canManage = useHasPermission('travelers.manage');
  // "Viajero registrado." o "Cambios guardados.", si se llega desde el formulario.
  const notice = usePageNotice(travelerNoticeTarget(travelerId ?? 0));

  return (
    <TravelerLoader
      travelerId={travelerId}
      back={{ href: '/viajeros', label: 'Viajeros' }}
    >
      {(traveler) => (
        <>
          <PageHeader
            eyebrow="Operación / 03"
            title={traveler.full_name}
            actions={
              canManage && (
                <ButtonLink
                  href={`/viajeros/${traveler.id}/editar`}
                  variant="outline"
                >
                  <Pencil aria-hidden="true" />
                  Editar datos
                </ButtonLink>
              )
            }
          />
          {notice && <Alert variant="info" title={notice} />}
          {traveler.is_the_client && (
            <Alert variant="info">
              Sus datos de viajero se guardan aparte de su ficha de cliente: si
              cambias uno, el otro no cambia.
            </Alert>
          )}
          <TravelerDetail traveler={traveler} />
        </>
      )}
    </TravelerLoader>
  );
}

'use client';

import { Pencil } from 'lucide-react';

import { Alert } from '@/components/alert';
import { ButtonLink } from '@/components/button-link';
import { PageHeader } from '@/components/page-header';
import { useHasPermission } from '@/features/auth/permissions';
import { parseRouteId } from '@/lib/route-id';
import { usePageNotice } from '@/lib/use-page-notice';

import { clientNoticeTarget } from '../client-notice';
import { ClientDetail } from './client-detail';
import { ClientLoader } from './client-loader';

export function ClientDetailScreen({ id }: { id: string }) {
  const clientId = parseRouteId(id);
  const canManage = useHasPermission('clients.manage');
  // "Cliente registrado." o "Cambios guardados.", si se llega desde el formulario.
  const notice = usePageNotice(clientNoticeTarget(clientId ?? 0));

  return (
    <ClientLoader
      clientId={clientId}
      back={{ href: '/clientes', label: 'Clientes' }}
    >
      {(client) => (
        <>
          <PageHeader
            eyebrow="Operación / 02"
            title={client.display_name}
            actions={
              canManage && (
                <ButtonLink
                  href={`/clientes/${client.id}/editar`}
                  variant="outline"
                >
                  <Pencil aria-hidden="true" />
                  Editar datos
                </ButtonLink>
              )
            }
          />
          {notice && <Alert variant="info" title={notice} />}
          <ClientDetail client={client} />
        </>
      )}
    </ClientLoader>
  );
}

'use client';

import { PageHeader } from '@/components/page-header';
import { parseRouteId } from '@/lib/route-id';

import { ChangeRoleForm } from './change-role-form';
import { UserLoader } from './user-loader';

export function ChangeRoleScreen({ id }: { id: string }) {
  const userId = parseRouteId(id);
  return (
    <UserLoader
      userId={userId}
      back={{ href: `/usuarios/${id}`, label: 'Volver a la ficha' }}
    >
      {(user) => (
        <>
          <PageHeader
            eyebrow="Administración / 02"
            title="Cambiar rol"
            description="El rol decide qué partes del panel puede usar esta persona."
          />
          {/* El rol elegido se fija al montar: una nueva lectura de la ficha no lo pisa. */}
          <ChangeRoleForm user={user} />
        </>
      )}
    </UserLoader>
  );
}

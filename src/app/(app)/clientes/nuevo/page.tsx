import { Suspense } from 'react';

import { RequirePermission } from '@/features/auth/components/require-permission';
import { CreateClientScreen } from '@/features/clients/components/create-client-screen';

export default function NewClientPage() {
  return (
    <RequirePermission codes={['clients.view', 'clients.manage']}>
      {/* La pantalla a la que volver se lee de la URL: sin este límite el build no puede
          prerenderizar. */}
      <Suspense>
        <CreateClientScreen />
      </Suspense>
    </RequirePermission>
  );
}

import { Suspense } from 'react';

import { RequirePermission } from '@/features/auth/components/require-permission';
import { ClientsScreen } from '@/features/clients/components/clients-screen';

export default function ClientsPage() {
  return (
    <RequirePermission codes={['clients.view']}>
      {/* Los filtros se leen de la URL: sin este límite el build no puede prerenderizar. */}
      <Suspense>
        <ClientsScreen />
      </Suspense>
    </RequirePermission>
  );
}

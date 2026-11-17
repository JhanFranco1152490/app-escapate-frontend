import { Suspense } from 'react';

import { RequirePermission } from '@/features/auth/components/require-permission';
import { PendingScreen } from '@/features/travel-requests/components/pending-screen';

export default function PendingQuotesPage() {
  return (
    <RequirePermission codes={['travel_requests.view']}>
      {/* Los filtros se leen de la URL: sin este límite el build no puede prerenderizar. */}
      <Suspense>
        <PendingScreen />
      </Suspense>
    </RequirePermission>
  );
}

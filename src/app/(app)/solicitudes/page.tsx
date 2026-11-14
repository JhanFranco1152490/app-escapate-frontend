import { Suspense } from 'react';

import { RequirePermission } from '@/features/auth/components/require-permission';
import { RequestsScreen } from '@/features/travel-requests/components/requests-screen';

export default function TravelRequestsPage() {
  return (
    <RequirePermission codes={['travel_requests.view']}>
      {/* Los filtros se leen de la URL: sin este límite el build no puede prerenderizar. */}
      <Suspense>
        <RequestsScreen />
      </Suspense>
    </RequirePermission>
  );
}

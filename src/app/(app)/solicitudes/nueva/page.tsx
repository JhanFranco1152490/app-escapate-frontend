import { Suspense } from 'react';

import { RequirePermission } from '@/features/auth/components/require-permission';
import { CreateRequestScreen } from '@/features/travel-requests/components/create-request-screen';

export default function NewTravelRequestPage() {
  return (
    <RequirePermission
      codes={['travel_requests.view', 'travel_requests.manage']}
    >
      {/* El cliente de origen se lee de la URL: sin este límite el build no puede
          prerenderizar. */}
      <Suspense>
        <CreateRequestScreen />
      </Suspense>
    </RequirePermission>
  );
}

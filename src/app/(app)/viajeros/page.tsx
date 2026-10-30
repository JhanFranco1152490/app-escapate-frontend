import { Suspense } from 'react';

import { RequirePermission } from '@/features/auth/components/require-permission';
import { TravelersScreen } from '@/features/travelers/components/travelers-screen';

export default function TravelersPage() {
  return (
    <RequirePermission codes={['travelers.view']}>
      {/* Los filtros se leen de la URL: sin este límite el build no puede prerenderizar. */}
      <Suspense>
        <TravelersScreen />
      </Suspense>
    </RequirePermission>
  );
}

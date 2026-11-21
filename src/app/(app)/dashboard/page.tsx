import { Suspense } from 'react';

import { RequirePermission } from '@/features/auth/components/require-permission';
import { DashboardScreen } from '@/features/reports/components/dashboard-screen';

export default function Page() {
  return (
    <RequirePermission codes={['reports.view']}>
      {/* El período se lee de la URL: sin este límite el build no puede prerenderizar. */}
      <Suspense>
        <DashboardScreen />
      </Suspense>
    </RequirePermission>
  );
}

import { Suspense } from 'react';

import { RequirePermission } from '@/features/auth/components/require-permission';
import { SalesScreen } from '@/features/sales/components/sales-screen';

export default function SalesPage() {
  return (
    <RequirePermission codes={['sales.view']}>
      {/* Los filtros se leen de la URL: sin este límite el build no puede prerenderizar. */}
      <Suspense>
        <SalesScreen />
      </Suspense>
    </RequirePermission>
  );
}

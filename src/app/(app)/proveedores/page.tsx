import { Suspense } from 'react';

import { RequirePermission } from '@/features/auth/components/require-permission';
import { SuppliersScreen } from '@/features/suppliers/components/suppliers-screen';

export default function SuppliersPage() {
  return (
    <RequirePermission codes={['suppliers.view']}>
      {/* Los filtros se leen de la URL: sin este límite el build no puede prerenderizar. */}
      <Suspense>
        <SuppliersScreen />
      </Suspense>
    </RequirePermission>
  );
}

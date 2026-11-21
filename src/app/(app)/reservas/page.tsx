import { Suspense } from 'react';

import { RequirePermission } from '@/features/auth/components/require-permission';
import { BookingsScreen } from '@/features/sales/components/bookings-screen';

export default function BookingsPage() {
  return (
    <RequirePermission codes={['sales.view']}>
      {/* El estado se lee de la URL: sin este límite el build no puede prerenderizar. */}
      <Suspense>
        <BookingsScreen />
      </Suspense>
    </RequirePermission>
  );
}

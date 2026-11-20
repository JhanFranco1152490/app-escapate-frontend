import { Suspense } from 'react';

import { RequirePermission } from '@/features/auth/components/require-permission';
import { FollowUpsScreen } from '@/features/quotes/components/follow-ups-screen';

export default function FollowUpsPage() {
  return (
    <RequirePermission codes={['quotes.view']}>
      {/* La pestaña se lee de la URL: sin este límite el build no puede prerenderizar. */}
      <Suspense>
        <FollowUpsScreen />
      </Suspense>
    </RequirePermission>
  );
}

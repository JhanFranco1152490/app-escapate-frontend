import { Suspense } from 'react';

import { RequirePermission } from '@/features/auth/components/require-permission';
import { OfferScreen } from '@/features/quotes/components/offer-screen';

export default function OfferPage() {
  return (
    <RequirePermission codes={['quotes.view']}>
      {/* La búsqueda se lee de la URL: sin este límite el build no puede prerenderizar. */}
      <Suspense>
        <OfferScreen />
      </Suspense>
    </RequirePermission>
  );
}

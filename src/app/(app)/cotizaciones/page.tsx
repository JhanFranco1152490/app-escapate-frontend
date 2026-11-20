import { Suspense } from 'react';

import { RequirePermission } from '@/features/auth/components/require-permission';
import { QuotesScreen } from '@/features/quotes/components/quotes-screen';

export default function QuotesPage() {
  return (
    <RequirePermission codes={['quotes.view']}>
      {/* Los filtros se leen de la URL: sin este límite el build no puede prerenderizar. */}
      <Suspense>
        <QuotesScreen />
      </Suspense>
    </RequirePermission>
  );
}

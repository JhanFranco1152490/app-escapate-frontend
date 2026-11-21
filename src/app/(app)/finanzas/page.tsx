import { Suspense } from 'react';

import { RequirePermission } from '@/features/auth/components/require-permission';
import { FinanceScreen } from '@/features/finance/components/finance-screen';

export default function FinancePage() {
  return (
    <RequirePermission codes={['finance.view']}>
      {/* El período se lee de la URL: sin este límite el build no puede prerenderizar. */}
      <Suspense>
        <FinanceScreen />
      </Suspense>
    </RequirePermission>
  );
}

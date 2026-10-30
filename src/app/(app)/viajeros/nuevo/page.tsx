import { Suspense } from 'react';

import { RequirePermission } from '@/features/auth/components/require-permission';
import { CreateTravelerScreen } from '@/features/travelers/components/create-traveler-screen';

export default function NewTravelerPage() {
  return (
    <RequirePermission codes={['travelers.view', 'travelers.manage']}>
      {/* El cliente de origen se lee de la URL: sin este límite el build no puede
          prerenderizar. */}
      <Suspense>
        <CreateTravelerScreen />
      </Suspense>
    </RequirePermission>
  );
}

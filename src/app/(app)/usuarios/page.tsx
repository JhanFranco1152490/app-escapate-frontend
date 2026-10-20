import { Suspense } from 'react';

import { RequirePermission } from '@/features/auth/components/require-permission';
import { UsersScreen } from '@/features/users/components/users-screen';

export default function UsersPage() {
  return (
    <RequirePermission codes={['users.view']}>
      {/* Los filtros se leen de la URL: sin este límite el build no puede prerenderizar. */}
      <Suspense>
        <UsersScreen />
      </Suspense>
    </RequirePermission>
  );
}

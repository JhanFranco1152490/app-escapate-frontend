import { Suspense } from 'react';

import { RequirePermission } from '@/features/auth/components/require-permission';
import { UserDetailScreen } from '@/features/users/components/user-detail-screen';

export default async function UserPage({
  params,
}: PageProps<'/usuarios/[id]'>) {
  const { id } = await params;
  return (
    <RequirePermission codes={['users.view']}>
      {/* La página del historial se lee de la URL. */}
      <Suspense>
        <UserDetailScreen id={id} />
      </Suspense>
    </RequirePermission>
  );
}

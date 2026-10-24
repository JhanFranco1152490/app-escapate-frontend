import type { ReactNode } from 'react';

import { RequirePermission } from '@/features/auth/components/require-permission';
import { RolesLayout } from '@/features/roles/components/roles-layout';

export default function RolesSectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RequirePermission codes={['roles.view']}>
      <RolesLayout>{children}</RolesLayout>
    </RequirePermission>
  );
}

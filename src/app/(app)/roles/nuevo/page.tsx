import { RequirePermission } from '@/features/auth/components/require-permission';
import { CreateRoleScreen } from '@/features/roles/components/create-role-screen';

// El layout de /roles ya exige roles.view.
export default function NewRolePage() {
  return (
    <RequirePermission codes={['roles.manage']}>
      <CreateRoleScreen />
    </RequirePermission>
  );
}

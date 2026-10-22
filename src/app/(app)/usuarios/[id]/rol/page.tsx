import { RequirePermission } from '@/features/auth/components/require-permission';
import { ChangeRoleScreen } from '@/features/users/components/change-role-screen';

// No pide roles.view: quien gestiona usuarios puede cambiar roles sin ver la pantalla de
// roles.
export default async function ChangeRolePage({
  params,
}: PageProps<'/usuarios/[id]/rol'>) {
  const { id } = await params;
  return (
    <RequirePermission codes={['users.view', 'users.manage']}>
      <ChangeRoleScreen id={id} />
    </RequirePermission>
  );
}

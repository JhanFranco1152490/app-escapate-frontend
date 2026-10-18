import { RequirePermission } from '@/features/auth/components/require-permission';
import { CreateUserScreen } from '@/features/users/components/create-user-screen';

export default function NewUserPage() {
  return (
    <RequirePermission codes={['users.view', 'users.manage']}>
      <CreateUserScreen />
    </RequirePermission>
  );
}

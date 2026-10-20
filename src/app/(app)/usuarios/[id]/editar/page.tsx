import { RequirePermission } from '@/features/auth/components/require-permission';
import { EditUserScreen } from '@/features/users/components/edit-user-screen';

export default async function EditUserPage({
  params,
}: PageProps<'/usuarios/[id]/editar'>) {
  const { id } = await params;
  return (
    <RequirePermission codes={['users.view', 'users.manage']}>
      <EditUserScreen id={id} />
    </RequirePermission>
  );
}

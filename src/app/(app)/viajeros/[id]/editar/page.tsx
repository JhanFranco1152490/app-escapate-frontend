import { RequirePermission } from '@/features/auth/components/require-permission';
import { EditTravelerScreen } from '@/features/travelers/components/edit-traveler-screen';

export default async function EditTravelerPage({
  params,
}: PageProps<'/viajeros/[id]/editar'>) {
  const { id } = await params;
  return (
    <RequirePermission codes={['travelers.view', 'travelers.manage']}>
      <EditTravelerScreen id={id} />
    </RequirePermission>
  );
}

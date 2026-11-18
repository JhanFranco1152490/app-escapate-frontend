import { RequirePermission } from '@/features/auth/components/require-permission';
import { EditRequestScreen } from '@/features/travel-requests/components/edit-request-screen';

export default async function EditTravelRequestPage({
  params,
}: PageProps<'/solicitudes/[id]/editar'>) {
  const { id } = await params;
  return (
    <RequirePermission
      codes={['travel_requests.view', 'travel_requests.manage']}
    >
      <EditRequestScreen id={id} />
    </RequirePermission>
  );
}

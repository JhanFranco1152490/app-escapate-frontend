import { RequirePermission } from '@/features/auth/components/require-permission';
import { RequestDetailScreen } from '@/features/travel-requests/components/request-detail-screen';

export default async function TravelRequestPage({
  params,
}: PageProps<'/solicitudes/[id]'>) {
  const { id } = await params;
  return (
    <RequirePermission codes={['travel_requests.view']}>
      <RequestDetailScreen id={id} />
    </RequirePermission>
  );
}

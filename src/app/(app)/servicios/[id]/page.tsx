import { RequirePermission } from '@/features/auth/components/require-permission';
import { TouristServiceDetailScreen } from '@/features/tourist-services/components/tourist-service-detail-screen';

export default async function TouristServicePage({
  params,
}: PageProps<'/servicios/[id]'>) {
  const { id } = await params;
  return (
    <RequirePermission codes={['suppliers.view', 'tourist_services.view']}>
      <TouristServiceDetailScreen id={id} />
    </RequirePermission>
  );
}

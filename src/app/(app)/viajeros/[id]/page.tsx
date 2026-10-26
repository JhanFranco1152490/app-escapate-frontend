import { RequirePermission } from '@/features/auth/components/require-permission';
import { TravelerDetailScreen } from '@/features/travelers/components/traveler-detail-screen';

export default async function TravelerPage({
  params,
}: PageProps<'/viajeros/[id]'>) {
  const { id } = await params;
  return (
    <RequirePermission codes={['travelers.view']}>
      <TravelerDetailScreen id={id} />
    </RequirePermission>
  );
}

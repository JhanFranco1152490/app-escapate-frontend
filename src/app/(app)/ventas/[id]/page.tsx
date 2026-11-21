import { RequirePermission } from '@/features/auth/components/require-permission';
import { SaleDetailScreen } from '@/features/sales/components/sale-detail-screen';

export default async function SalePage({ params }: PageProps<'/ventas/[id]'>) {
  const { id } = await params;
  return (
    <RequirePermission codes={['sales.view']}>
      <SaleDetailScreen id={id} />
    </RequirePermission>
  );
}

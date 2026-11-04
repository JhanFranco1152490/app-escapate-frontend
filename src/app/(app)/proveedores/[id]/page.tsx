import { RequirePermission } from '@/features/auth/components/require-permission';
import { SupplierDetailScreen } from '@/features/suppliers/components/supplier-detail-screen';

export default async function SupplierPage({
  params,
}: PageProps<'/proveedores/[id]'>) {
  const { id } = await params;
  return (
    <RequirePermission codes={['suppliers.view']}>
      <SupplierDetailScreen id={id} />
    </RequirePermission>
  );
}

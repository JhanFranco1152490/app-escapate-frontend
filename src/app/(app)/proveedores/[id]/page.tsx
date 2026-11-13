import { RequirePermission } from '@/features/auth/components/require-permission';
import { SupplierDetailWithServices } from '@/features/tourist-services/components/supplier-detail-with-services';

export default async function SupplierPage({
  params,
}: PageProps<'/proveedores/[id]'>) {
  const { id } = await params;
  return (
    <RequirePermission codes={['suppliers.view']}>
      <SupplierDetailWithServices id={id} />
    </RequirePermission>
  );
}

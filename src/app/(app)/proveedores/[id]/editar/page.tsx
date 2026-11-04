import { RequirePermission } from '@/features/auth/components/require-permission';
import { EditSupplierScreen } from '@/features/suppliers/components/edit-supplier-screen';

export default async function EditSupplierPage({
  params,
}: PageProps<'/proveedores/[id]/editar'>) {
  const { id } = await params;
  return (
    <RequirePermission codes={['suppliers.view', 'suppliers.manage']}>
      <EditSupplierScreen id={id} />
    </RequirePermission>
  );
}

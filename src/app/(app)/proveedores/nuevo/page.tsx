import { RequirePermission } from '@/features/auth/components/require-permission';
import { CreateSupplierScreen } from '@/features/suppliers/components/create-supplier-screen';

export default function NewSupplierPage() {
  return (
    <RequirePermission codes={['suppliers.view', 'suppliers.manage']}>
      <CreateSupplierScreen />
    </RequirePermission>
  );
}

import { RequirePermission } from '@/features/auth/components/require-permission';
import { CreateServiceScreen } from '@/features/tourist-services/components/create-service-screen';

export default async function NewServicePage({
  params,
}: PageProps<'/proveedores/[id]/servicios/nuevo'>) {
  const { id } = await params;
  return (
    <RequirePermission
      codes={[
        'suppliers.view',
        'tourist_services.view',
        'tourist_services.manage',
      ]}
    >
      <CreateServiceScreen supplierId={id} />
    </RequirePermission>
  );
}

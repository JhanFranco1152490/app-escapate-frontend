import { RequirePermission } from '@/features/auth/components/require-permission';
import { EditServiceScreen } from '@/features/tourist-services/components/edit-service-screen';

export default async function EditTouristServicePage({
  params,
}: PageProps<'/servicios/[id]/editar'>) {
  const { id } = await params;
  return (
    <RequirePermission
      codes={[
        'suppliers.view',
        'tourist_services.view',
        'tourist_services.manage',
      ]}
    >
      <EditServiceScreen id={id} />
    </RequirePermission>
  );
}

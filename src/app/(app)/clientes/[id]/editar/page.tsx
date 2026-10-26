import { RequirePermission } from '@/features/auth/components/require-permission';
import { EditClientScreen } from '@/features/clients/components/edit-client-screen';

export default async function EditClientPage({
  params,
}: PageProps<'/clientes/[id]/editar'>) {
  const { id } = await params;
  return (
    <RequirePermission codes={['clients.view', 'clients.manage']}>
      <EditClientScreen id={id} />
    </RequirePermission>
  );
}

import { RequirePermission } from '@/features/auth/components/require-permission';
import { ClientDetailScreen } from '@/features/clients/components/client-detail-screen';

export default async function ClientPage({
  params,
}: PageProps<'/clientes/[id]'>) {
  const { id } = await params;
  return (
    <RequirePermission codes={['clients.view']}>
      <ClientDetailScreen id={id} />
    </RequirePermission>
  );
}

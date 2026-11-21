import { RequirePermission } from '@/features/auth/components/require-permission';
import { ClientDetailScreen } from '@/features/clients/components/client-detail-screen';
import { ClientHistorySection } from '@/features/reports/components/client-history-section';

export default async function ClientPage({
  params,
}: PageProps<'/clientes/[id]'>) {
  const { id } = await params;
  return (
    <RequirePermission codes={['clients.view']}>
      <div className="flex flex-col gap-7">
        <ClientDetailScreen id={id} />
        <ClientHistorySection id={id} />
      </div>
    </RequirePermission>
  );
}

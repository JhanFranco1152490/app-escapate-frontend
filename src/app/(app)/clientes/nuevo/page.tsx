import { RequirePermission } from '@/features/auth/components/require-permission';
import { CreateClientScreen } from '@/features/clients/components/create-client-screen';

export default function NewClientPage() {
  return (
    <RequirePermission codes={['clients.view', 'clients.manage']}>
      <CreateClientScreen />
    </RequirePermission>
  );
}

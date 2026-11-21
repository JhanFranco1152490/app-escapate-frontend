import { RequirePermission } from '@/features/auth/components/require-permission';
import { PackagesScreen } from '@/features/quotes/components/packages-screen';

export default function PackagesPage() {
  return (
    <RequirePermission codes={['quotes.view']}>
      <PackagesScreen />
    </RequirePermission>
  );
}

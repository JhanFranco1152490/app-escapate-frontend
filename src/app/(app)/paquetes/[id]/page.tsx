import { RequirePermission } from '@/features/auth/components/require-permission';
import { PackageDetailScreen } from '@/features/quotes/components/package-detail-screen';

export default async function PackagePage({
  params,
}: PageProps<'/paquetes/[id]'>) {
  const { id } = await params;
  return (
    <RequirePermission codes={['quotes.view']}>
      <PackageDetailScreen id={id} />
    </RequirePermission>
  );
}

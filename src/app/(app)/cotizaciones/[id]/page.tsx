import { RequirePermission } from '@/features/auth/components/require-permission';
import { QuoteDetailScreen } from '@/features/quotes/components/quote-detail-screen';

export default async function QuotePage({
  params,
}: PageProps<'/cotizaciones/[id]'>) {
  const { id } = await params;
  return (
    <RequirePermission codes={['quotes.view']}>
      <QuoteDetailScreen id={id} />
    </RequirePermission>
  );
}

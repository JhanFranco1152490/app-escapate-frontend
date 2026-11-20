import { RequirePermission } from '@/features/auth/components/require-permission';
import { QuoteDocumentScreen } from '@/features/quotes/components/quote-document-screen';

export default async function QuoteDocumentPage({
  params,
}: PageProps<'/cotizaciones/[id]/documento'>) {
  const { id } = await params;
  return (
    <RequirePermission codes={['quotes.view']}>
      <QuoteDocumentScreen id={id} />
    </RequirePermission>
  );
}

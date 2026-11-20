import { RequirePermission } from '@/features/auth/components/require-permission';
import { EditQuoteConditionsScreen } from '@/features/quotes/components/edit-quote-conditions-screen';

export default async function EditQuoteConditionsPage({
  params,
}: PageProps<'/cotizaciones/[id]/condiciones'>) {
  const { id } = await params;
  return (
    <RequirePermission codes={['quotes.view', 'quotes.manage']}>
      <EditQuoteConditionsScreen id={id} />
    </RequirePermission>
  );
}

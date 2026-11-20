import { RequirePermission } from '@/features/auth/components/require-permission';
import { EditQuoteGeneralScreen } from '@/features/quotes/components/edit-quote-general-screen';

export default async function EditQuotePage({
  params,
}: PageProps<'/cotizaciones/[id]/editar'>) {
  const { id } = await params;
  return (
    <RequirePermission codes={['quotes.view', 'quotes.manage']}>
      <EditQuoteGeneralScreen id={id} />
    </RequirePermission>
  );
}

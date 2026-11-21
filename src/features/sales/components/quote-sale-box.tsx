'use client';

import { useRouter } from 'next/navigation';

import { Alert } from '@/components/alert';
import { ButtonLink } from '@/components/button-link';
import { Button } from '@/components/ui/button';
import { useHasPermission } from '@/features/auth/permissions';
import { actionErrorMessage } from '@/lib/action-feedback';
import { formatMoney } from '@/lib/format/money';
import { setPageNotice } from '@/lib/page-notice';

import { useCreateSale, useSales } from '../api';
import { saleNoticeTarget } from './sale-detail-screen';
import { PaymentStatusBadge } from './payment-status-badge';

// En la ficha de una cotización aceptada: su venta, o el botón para registrarla.
export function QuoteSaleBox({ quoteId }: { quoteId: number }) {
  const router = useRouter();
  const canView = useHasPermission('sales.view');
  const canManage = useHasPermission('sales.manage');
  const sales = useSales(
    { q: '', paymentStatus: null, quoteId, page: 1 },
    canView,
  );
  const create = useCreateSale();

  if (!canView || !sales.data) return null;
  const sale = sales.data.results[0];

  const register = () =>
    create.mutate(
      { quote_id: quoteId },
      {
        onSuccess: (created) => {
          setPageNotice({
            target: saleNoticeTarget(created.id),
            text: 'Venta registrada. Ya puedes registrar los pagos del cliente.',
          });
          router.push(`/ventas/${created.id}`);
        },
      },
    );

  return (
    <section className="flex flex-col gap-3 rounded-md border border-[rgb(var(--ok))]/40 bg-card px-5 py-4">
      {create.isError && <Alert title={actionErrorMessage(create.error)} />}
      {sale ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            Vendida como <strong>{sale.code}</strong> por{' '}
            {formatMoney(sale.total_price)} · saldo {formatMoney(sale.balance)}
          </p>
          <PaymentStatusBadge status={sale.payment_status} />
          <ButtonLink href={`/ventas/${sale.id}`} variant="outline">
            Ver venta y pagos
          </ButtonLink>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            El cliente aceptó esta cotización. Regístrala como venta para llevar
            sus pagos.
          </p>
          {canManage && (
            <Button onClick={register} disabled={create.isPending}>
              {create.isPending ? 'Registrando…' : 'Registrar venta'}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

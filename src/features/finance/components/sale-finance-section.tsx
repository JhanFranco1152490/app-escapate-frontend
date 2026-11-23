'use client';

import { useState } from 'react';

import { Alert } from '@/components/alert';
import { DetailItem } from '@/components/detail-item';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useHasPermission } from '@/features/auth/permissions';
import { actionErrorMessage } from '@/lib/action-feedback';
import { formatShortDate, todayInBogota } from '@/lib/format/dates';
import { formatMoney, formatPercentage } from '@/lib/format/money';
import { parseAmount } from '@/lib/validation/amount';

import {
  useAddCost,
  useProfitability,
  useRemoveCost,
  useUpdateCost,
  type ActualCost,
} from '../api';

function AddCostForm({ saleId }: { saleId: number }) {
  const add = useAddCost(saleId);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidOn, setPaidOn] = useState('');
  const [error, setError] = useState<string>();

  const save = () => {
    const parsed = parseAmount(amount, 'COP');
    if (!description.trim()) return setError('Indica qué se pagó.');
    if ('error' in parsed) return setError(parsed.error);
    setError(undefined);
    add.mutate(
      {
        description: description.trim(),
        amount: Number(parsed.value),
        paid_on: paidOn || null,
      },
      {
        onSuccess: () => {
          setDescription('');
          setAmount('');
          setPaidOn('');
        },
        onError: (failure) => setError(actionErrorMessage(failure)),
      },
    );
  };

  return (
    <div className="flex flex-col gap-3 border-t px-5 py-4">
      {error && <Alert title={error} />}
      <div className="grid gap-3 md:grid-cols-[1fr_10rem_10rem_auto] md:items-end">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cost-description">Costo real</Label>
          <Input
            id="cost-description"
            maxLength={150}
            className="h-11"
            placeholder="Hotel Las Américas, 6 noches"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cost-amount">Valor (COP)</Label>
          <Input
            id="cost-amount"
            inputMode="numeric"
            className="h-11"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cost-paid-on">Pagado el</Label>
          <Input
            id="cost-paid-on"
            type="date"
            className="h-11"
            value={paidOn}
            onChange={(event) => setPaidOn(event.target.value)}
          />
        </div>
        <Button onClick={save} disabled={add.isPending}>
          Agregar costo
        </Button>
      </div>
      <p className="text-[0.78125rem] text-muted-foreground">
        Sin fecha de pago, el valor queda como adeudado al proveedor.
      </p>
    </div>
  );
}

function CostRow({ saleId, cost }: { saleId: number; cost: ActualCost }) {
  const canManage = useHasPermission('finance.manage');
  const update = useUpdateCost(saleId);
  const remove = useRemoveCost(saleId);
  const markPaid = () =>
    update.mutate({
      id: cost.id,
      body: {
        description: cost.description,
        supplier_id: cost.supplier?.id ?? null,
        amount: cost.amount,
        paid_on: todayInBogota(),
      },
    });

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
      <span className="font-medium">{cost.description}</span>
      <span>{formatMoney(cost.amount)}</span>
      <span className="text-muted-foreground">
        {cost.paid_on
          ? `Pagado el ${formatShortDate(cost.paid_on)}`
          : 'Adeudado al proveedor'}
      </span>
      {canManage && (
        <span className="flex gap-2">
          {!cost.paid_on && (
            <Button size="sm" onClick={markPaid} disabled={update.isPending}>
              Marcar pagado hoy
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => remove.mutate(cost.id)}
            disabled={remove.isPending}
          >
            Quitar
          </Button>
        </span>
      )}
    </li>
  );
}

// Costos reales de la venta (lo que se paga a los proveedores) y su rentabilidad. Mientras no
// hay costos reales, la ganancia se calcula con el costo estimado de la cotización.
export function SaleFinanceSection({ saleId }: { saleId: number }) {
  const canView = useHasPermission('finance.view');
  const canManage = useHasPermission('finance.manage');
  const result = useProfitability(saleId, canView);
  if (!canView || !result.data) return null;
  const data = result.data;

  return (
    <section
      aria-labelledby="sale-finance-title"
      className="rounded-md border bg-card"
    >
      <h2
        id="sale-finance-title"
        className="border-b px-5 py-4 font-heading text-lg font-semibold"
      >
        Costos reales y rentabilidad
      </h2>
      <dl className="grid gap-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4">
        <DetailItem term="Precio de venta">
          {formatMoney(data.sale_price)}
        </DetailItem>
        <DetailItem term="Costo estimado">
          {formatMoney(data.estimated_cost)}
        </DetailItem>
        <DetailItem term="Costo real">
          {data.uses_actual_cost
            ? formatMoney(data.actual_cost)
            : 'Sin registrar'}
        </DetailItem>
        <DetailItem term="Ganancia">
          <span className="text-base font-semibold">
            {formatMoney(data.profit)}
          </span>
          {data.margin_percent && ` (${formatPercentage(data.margin_percent)})`}
          {!data.uses_actual_cost && (
            <span className="block text-xs text-muted-foreground">
              Con el costo estimado
            </span>
          )}
        </DetailItem>
        <DetailItem term="Diferencia con lo estimado">
          {data.uses_actual_cost
            ? `${data.cost_difference > 0 ? '+' : ''}${formatMoney(data.cost_difference)}`
            : '—'}
        </DetailItem>
        <DetailItem term="Pagado a proveedores">
          {formatMoney(data.paid_to_suppliers)}
        </DetailItem>
        <DetailItem term="Adeudado a proveedores">
          {formatMoney(data.owed_to_suppliers)}
        </DetailItem>
      </dl>
      {/* Un solo costo registrado ya reemplaza al estimado completo: si es menor, puede que
          falten por registrar y la ganancia salga mayor a la real. */}
      {data.uses_actual_cost && data.actual_cost < data.estimated_cost && (
        <div className="px-5 pb-5">
          <Alert
            variant="info"
            title="El costo real registrado es menor que el estimado."
          >
            <p>
              Si todavía faltan costos por registrar, la ganancia real será
              menor a la que se muestra: solo cuenta lo registrado.
            </p>
          </Alert>
        </div>
      )}
      {data.costs.length > 0 && (
        <ul className="divide-y border-t">
          {data.costs.map((cost) => (
            <CostRow key={cost.id} saleId={saleId} cost={cost} />
          ))}
        </ul>
      )}
      {canManage && <AddCostForm saleId={saleId} />}
    </section>
  );
}

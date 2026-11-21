'use client';

import { useState } from 'react';

import { Alert } from '@/components/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { actionErrorMessage } from '@/lib/action-feedback';
import { isApiError } from '@/lib/api/errors';
import { todayInBogota } from '@/lib/format/dates';
import { parseAmount } from '@/lib/validation/amount';

import { useAddPayment, type PaymentMethod } from '../api';
import { PAYMENT_METHOD_LABELS } from '../labels';

// Registrar un pago o abono del cliente. La API rechaza lo que pase del saldo.
export function AddPaymentForm({
  saleId,
  onDone,
}: {
  saleId: number;
  onDone: () => void;
}) {
  const add = useAddPayment(saleId);
  const [amount, setAmount] = useState('');
  const [paidOn, setPaidOn] = useState(todayInBogota());
  const [method, setMethod] = useState<PaymentMethod>('transfer');
  const [reference, setReference] = useState('');
  const [error, setError] = useState<string>();

  const save = () => {
    const parsed = parseAmount(amount, 'COP');
    if ('error' in parsed) return setError(parsed.error);
    setError(undefined);
    add.mutate(
      {
        amount: Number(parsed.value),
        paid_on: paidOn,
        method,
        reference: reference.trim() || null,
      },
      {
        onSuccess: () => {
          setAmount('');
          setReference('');
          onDone();
        },
        onError: (failure) =>
          setError(
            isApiError(failure) && failure.fields.amount
              ? failure.fields.amount[0]
              : actionErrorMessage(failure),
          ),
      },
    );
  };

  return (
    <div className="flex flex-col gap-3 border-t px-5 py-4">
      {error && <Alert title={error} />}
      <div className="grid gap-3 md:grid-cols-[1fr_10rem_10rem_1fr_auto] md:items-end">
        <div className="flex flex-col gap-2">
          <Label htmlFor="payment-amount">Valor (COP)</Label>
          <Input
            id="payment-amount"
            inputMode="numeric"
            className="h-11"
            placeholder="500.000"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="payment-date">Fecha</Label>
          <Input
            id="payment-date"
            type="date"
            className="h-11"
            value={paidOn}
            onChange={(event) => setPaidOn(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="payment-method">Medio</Label>
          <NativeSelect
            id="payment-method"
            className="w-full"
            value={method}
            onChange={(event) => setMethod(event.target.value as PaymentMethod)}
          >
            {Object.entries(PAYMENT_METHOD_LABELS).map(([code, label]) => (
              <NativeSelectOption key={code} value={code}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="payment-reference">Referencia</Label>
          <Input
            id="payment-reference"
            maxLength={100}
            className="h-11"
            placeholder="N.º de comprobante"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
          />
        </div>
        <Button onClick={save} disabled={add.isPending}>
          Registrar pago
        </Button>
      </div>
    </div>
  );
}

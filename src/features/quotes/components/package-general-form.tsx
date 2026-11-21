'use client';

import { useState } from 'react';

import { Alert } from '@/components/alert';
import { Textarea } from '@/components/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { actionErrorMessage } from '@/lib/action-feedback';
import { isApiError } from '@/lib/api/errors';
import { parseAmount } from '@/lib/validation/amount';
import { parsePercent, percentInput } from '@/lib/validation/percent';

import type { PackageCreate, PackageDetail } from '../package-api';

type PackageGeneralFormProps = {
  initial?: PackageDetail;
  submitLabel: string;
  pending: boolean;
  onSubmit: (body: PackageCreate) => Promise<unknown>;
  onCancel?: () => void;
};

const field = 'flex flex-col gap-2';

// Los datos de un paquete: nombre, destino, noches, para cuántas personas son los precios, el %
// por defecto, la tasa del dólar y si se ofrece.
export function PackageGeneralForm({
  initial,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: PackageGeneralFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [destination, setDestination] = useState(initial?.destination ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [nights, setNights] = useState(String(initial?.nights ?? 5));
  const [travelers, setTravelers] = useState(
    String(initial?.reference_travelers ?? 2),
  );
  const [markup, setMarkup] = useState(
    percentInput(initial?.default_markup_percent ?? '15.00'),
  );
  const [rate, setRate] = useState(
    initial?.exchange_rate ? initial.exchange_rate.replace('.', ',') : '',
  );
  const [active, setActive] = useState(initial?.is_active ?? true);
  const [error, setError] = useState<string>();

  const submit = async () => {
    const markupValue = parsePercent(markup, { min: 0, max: 999.99 });
    const rateValue = rate.trim() ? parseAmount(rate, 'USD') : null;
    if (!name.trim() || !destination.trim())
      return setError('Indica el nombre y el destino.');
    if (!/^\d+$/.test(nights) || !/^\d+$/.test(travelers))
      return setError('Noches y personas van en números enteros.');
    if ('error' in markupValue) return setError(markupValue.error);
    if (rateValue && 'error' in rateValue) return setError(rateValue.error);
    setError(undefined);
    try {
      await onSubmit({
        name: name.trim(),
        destination: destination.trim(),
        description: description.trim() || null,
        nights: Number(nights),
        reference_travelers: Number(travelers),
        default_markup_percent: markupValue.value,
        exchange_rate: rateValue?.value ?? null,
        is_active: active,
      });
    } catch (failure) {
      setError(
        isApiError(failure) && Object.keys(failure.fields).length
          ? Object.values(failure.fields).flat().join(' ')
          : actionErrorMessage(failure),
      );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert title={error} />}
      <div className="grid gap-4 md:grid-cols-2">
        <div className={field}>
          <Label htmlFor="package-name">Nombre *</Label>
          <Input
            id="package-name"
            maxLength={150}
            className="h-11"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className={field}>
          <Label htmlFor="package-destination">Destino *</Label>
          <Input
            id="package-destination"
            maxLength={150}
            className="h-11"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className={field}>
            <Label htmlFor="package-nights">Noches</Label>
            <Input
              id="package-nights"
              inputMode="numeric"
              className="h-11"
              value={nights}
              onChange={(event) => setNights(event.target.value)}
            />
          </div>
          <div className={field}>
            <Label htmlFor="package-travelers">Precios para</Label>
            <Input
              id="package-travelers"
              inputMode="numeric"
              className="h-11"
              value={travelers}
              onChange={(event) => setTravelers(event.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className={field}>
            <Label htmlFor="package-markup">% por defecto</Label>
            <Input
              id="package-markup"
              inputMode="decimal"
              className="h-11"
              value={markup}
              onChange={(event) => setMarkup(event.target.value)}
            />
          </div>
          <div className={field}>
            <Label htmlFor="package-rate">Pesos por dólar</Label>
            <Input
              id="package-rate"
              inputMode="decimal"
              className="h-11"
              value={rate}
              onChange={(event) => setRate(event.target.value)}
            />
          </div>
        </div>
        <div className={`${field} md:col-span-2`}>
          <Label htmlFor="package-description">Descripción</Label>
          <Textarea
            id="package-description"
            maxLength={4000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
      </div>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          className="size-5 accent-orange-500"
          checked={active}
          onChange={(event) => setActive(event.target.checked)}
        />
        Activo: se puede usar para cotizar
      </label>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button onClick={() => void submit()} disabled={pending}>
          {pending ? 'Guardando…' : submitLabel}
        </Button>
      </div>
    </div>
  );
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';

import { Alert } from '@/components/alert';
import { Button } from '@/components/ui/button';
import { rateLimitOr } from '@/lib/api/errors';
import { applyApiFormError } from '@/lib/api/form-errors';
import {
  SERVER_FIELDS_NOTICE,
  invalidFormNotice,
  type FormNotice,
} from '@/lib/form-notice';
import { AMOUNT_REQUIRED_MESSAGE } from '@/lib/validation/amount';

import { itemSchema, type ItemFormValues, type ItemPayload } from '../schemas';
import { OfferPicker } from './offer-picker';
import { QuoteItemFields } from './quote-item-fields';

// Los campos del formulario que también nombra la API en sus errores.
const FIELDS = [
  'service_type',
  'name',
  'details',
  'start_date',
  'end_date',
  'quantity',
  'charge_unit',
  'alternative_of_id',
  'quality_level',
  'tourist_service_id',
  'currency',
  'unit_cost',
  'markup_percent',
  'sale_price_override',
  'supplier_commission_percent',
] as const;

const GENERIC_SAVE_ERROR =
  'No pudimos guardar el servicio. Inténtalo de nuevo.';

type QuoteItemFormProps = {
  defaultValues: ItemFormValues;
  // Los servicios incluidos de los que este puede ser alternativa.
  alternatives: { id: number; name: string }[];
  onSubmit: (payload: ItemPayload) => Promise<unknown>;
  onCancel: () => void;
  notices?: ReactNode;
};

export function QuoteItemForm({
  defaultValues,
  alternatives,
  onSubmit,
  onCancel,
  notices,
}: QuoteItemFormProps) {
  const [notice, setNotice] = useState<FormNotice>();
  const form = useForm<ItemFormValues, unknown, ItemPayload>({
    resolver: zodResolver(itemSchema),
    defaultValues,
  });
  const {
    handleSubmit,
    setError,
    setFocus,
    formState: { isSubmitting },
  } = form;

  const submit = handleSubmit(
    async (payload) => {
      setNotice(undefined);
      try {
        await onSubmit(payload);
      } catch (error) {
        const { needsNotice, firstInvalid } = applyApiFormError(
          error,
          setError,
          FIELDS,
        );
        setNotice(
          needsNotice
            ? { title: rateLimitOr(error, GENERIC_SAVE_ERROR) }
            : SERVER_FIELDS_NOTICE,
        );
        if (firstInvalid) setFocus(firstInvalid);
      }
    },
    (invalid) =>
      setNotice(
        invalidFormNotice(invalid, {
          subject: 'el servicio',
          requiredMessages: [AMOUNT_REQUIRED_MESSAGE],
        }),
      ),
  );

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      {notice && (
        <Alert title={notice.title}>
          {notice.body && <p>{notice.body}</p>}
        </Alert>
      )}
      {notices}
      <OfferPicker form={form} />
      <QuoteItemFields form={form} alternatives={alternatives} />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : 'Guardar servicio'}
        </Button>
      </div>
    </form>
  );
}

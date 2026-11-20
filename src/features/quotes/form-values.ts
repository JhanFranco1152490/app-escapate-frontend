import { formatAmountInput } from '@/lib/format/money';
import { percentInput } from '@/lib/validation/percent';

import type { QuoteDetail, QuoteItem, ServiceType } from './api';
import type {
  ConditionsFormValues,
  GeneralFormValues,
  ItemFormValues,
} from './schemas';
import { CHARGE_UNITS } from './service-options';

export const generalFormValues = (quote: QuoteDetail): GeneralFormValues => ({
  destination: quote.destination,
  origin: quote.origin ?? '',
  departure_date: quote.departure_date ?? '',
  return_date: quote.return_date ?? '',
  adults: String(quote.adults),
  minors: String(quote.minors),
  valid_until: quote.valid_until,
  notes: quote.notes ?? '',
});

export const conditionsFormValues = (
  quote: QuoteDetail,
): ConditionsFormValues => ({
  deposit_percent: percentInput(quote.deposit_percent),
  balance_due_date: quote.balance_due_date ?? '',
  payment_terms: quote.payment_terms ?? '',
  policies: quote.policies ?? '',
});

// Un alojamiento en pesos con el % por defecto de la cotización: lo más común.
export const emptyItemForm = (
  quote: Pick<QuoteDetail, 'default_markup_percent'>,
  type: ServiceType = 'lodging',
): ItemFormValues => ({
  service_type: type,
  name: '',
  details: '',
  start_date: '',
  end_date: '',
  quantity: '1',
  charge_unit: CHARGE_UNITS[type][0],
  is_optional: false,
  currency: 'COP',
  unit_cost: '',
  markup_percent: percentInput(quote.default_markup_percent),
  supplier_commission_percent: '',
});

export const itemFormValues = (item: QuoteItem): ItemFormValues => ({
  service_type: item.service_type,
  name: item.name,
  details: item.details ?? '',
  start_date: item.start_date ?? '',
  end_date: item.end_date ?? '',
  quantity: String(item.quantity),
  charge_unit: item.charge_unit ?? '',
  is_optional: item.is_optional,
  currency: item.currency,
  unit_cost: formatAmountInput(item.unit_cost, item.currency),
  markup_percent: percentInput(item.markup_percent),
  supplier_commission_percent: percentInput(item.supplier_commission_percent),
});

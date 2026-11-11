import { formatAmountInput } from '@/lib/format/money';

import type { ServiceType } from './api';
import type { ServiceRate } from './rate-api';
import { CHARGE_UNITS } from './rate-options';
import type { RateFormValues } from './rate-schemas';

// Pesos y la primera unidad del tipo vienen elegidos: es lo más común.
export const emptyRateForm = (type: ServiceType): RateFormValues => ({
  name: '',
  valid_from: '',
  valid_until: '',
  currency: 'COP',
  charge_unit: CHARGE_UNITS[type][0],
  amount: '',
  conditions: '',
});

// El valor llega como cadena decimal ("1250.50") y se muestra como se escribe ("1.250,50").
export const rateFormValues = (rate: ServiceRate): RateFormValues => ({
  name: rate.name,
  valid_from: rate.valid_from,
  valid_until: rate.valid_until ?? '',
  currency: rate.currency,
  charge_unit: rate.charge_unit,
  amount: formatAmountInput(rate.amount, rate.currency),
  conditions: rate.conditions ?? '',
});

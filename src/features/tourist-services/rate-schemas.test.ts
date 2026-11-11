import { describe, expect, it } from 'vitest';

import {
  AMOUNT_FORMAT_MESSAGE,
  CENTS_IN_PESOS_MESSAGE,
} from '@/lib/validation/amount';
import { REQUIRED_MESSAGE } from '@/lib/validation/text';
import { buildServiceRate } from '@/test/tourist-services';

import { emptyRateForm, rateFormValues } from './rate-form-values';
import {
  ENDS_BEFORE_START_MESSAGE,
  rateFormSchema,
  type RateFormValues,
} from './rate-schemas';

const lodging = rateFormSchema('lodging');

const filled = (overrides: Partial<RateFormValues> = {}): RateFormValues => ({
  ...emptyRateForm('lodging'),
  name: ' Temporada alta ',
  valid_from: '2026-12-15',
  valid_until: '2027-01-15',
  amount: '710.000',
  ...overrides,
});

const errorsOf = (values: RateFormValues, schema = lodging) =>
  Object.fromEntries(
    (schema.safeParse(values).error?.issues ?? []).map((issue) => [
      issue.path.join('.'),
      issue.message,
    ]),
  );

describe('rateFormSchema', () => {
  it('trae elegidos COP y la primera unidad del tipo', () => {
    expect(emptyRateForm('lodging')).toMatchObject({
      currency: 'COP',
      charge_unit: 'per_night',
    });
    expect(emptyRateForm('other').charge_unit).toBe('per_service');
  });

  it('vacía dice qué falta', () => {
    expect(errorsOf(emptyRateForm('lodging'))).toEqual({
      name: REQUIRED_MESSAGE,
      valid_from: REQUIRED_MESSAGE,
      amount: 'Indica el valor de la tarifa.',
    });
  });

  it('envía el valor en pesos como cadena entera', () => {
    expect(lodging.parse(filled())).toEqual({
      name: 'Temporada alta',
      valid_from: '2026-12-15',
      valid_until: '2027-01-15',
      currency: 'COP',
      charge_unit: 'per_night',
      amount: '710000',
      conditions: null,
    });
  });

  it('en dólares envía los centavos y sin fecha de fin manda null', () => {
    expect(
      lodging.parse(
        filled({ currency: 'USD', amount: '1.250,50', valid_until: '' }),
      ),
    ).toMatchObject({ currency: 'USD', amount: '1250.50', valid_until: null });
  });

  it('centavos en pesos se marcan sin redondear', () => {
    expect(errorsOf(filled({ amount: '710.000,50' }))).toEqual({
      amount: CENTS_IN_PESOS_MESSAGE,
    });
  });

  it('un valor al estilo de Estados Unidos se marca con el formato', () => {
    expect(errorsOf(filled({ currency: 'USD', amount: '1,250.50' }))).toEqual({
      amount: AMOUNT_FORMAT_MESSAGE,
    });
  });

  it('la vigencia invertida se marca en la fecha final; el mismo día vale', () => {
    expect(errorsOf(filled({ valid_until: '2026-12-14' }))).toEqual({
      valid_until: ENDS_BEFORE_START_MESSAGE,
    });
    expect(errorsOf(filled({ valid_until: '2026-12-15' }))).toEqual({});
  });

  it('una unidad que no es del tipo no pasa', () => {
    expect(errorsOf(filled({ charge_unit: 'per_cabin' }))).toEqual({
      charge_unit: 'No es una opción válida.',
    });
  });
});

describe('rateFormValues', () => {
  it('llena el formulario con la tarifa y el valor como se escribe', () => {
    const values = rateFormValues(
      buildServiceRate({
        currency: 'USD',
        amount: '1250.50',
        valid_until: null,
      }),
    );

    expect(values).toMatchObject({
      amount: '1.250,50',
      currency: 'USD',
      valid_until: '',
    });
    expect(lodging.parse(values)).toMatchObject({ amount: '1250.50' });
  });
});

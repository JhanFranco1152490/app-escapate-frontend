import { describe, expect, it } from 'vitest';

import {
  AMOUNT_FORMAT_MESSAGE,
  AMOUNT_REQUIRED_MESSAGE,
  AMOUNT_TOO_LARGE_MESSAGE,
  CENTS_IN_PESOS_MESSAGE,
  NOT_POSITIVE_MESSAGE,
  parseAmount,
} from './amount';

describe('parseAmount', () => {
  it.each([
    ['710.000', '710000'],
    ['710000', '710000'],
    ['  710.000 ', '710000'],
    ['$ 710.000', '710000'],
    ['1.250', '1250'],
    ['999.999.999.999', '999999999999'],
    ['0710', '710'],
    // Centavos en cero no son centavos: el valor sigue siendo entero.
    ['710.000,00', '710000'],
  ])('en pesos lee %j como %j', (text, value) => {
    expect(parseAmount(text, 'COP')).toEqual({ value });
  });

  it.each([
    ['1.250,50', '1250.50'],
    ['1.250,5', '1250.50'],
    ['1250', '1250.00'],
    ['US$ 1.250,50', '1250.50'],
    ['0,99', '0.99'],
    ['999.999.999.999,00', '999999999999.00'],
  ])('en dólares lee %j como %j', (text, value) => {
    expect(parseAmount(text, 'USD')).toEqual({ value });
  });

  it('vacío es un dato que falta', () => {
    expect(parseAmount('  ', 'COP')).toEqual({
      error: AMOUNT_REQUIRED_MESSAGE,
    });
  });

  // Lo que se puede leer de dos formas no se adivina: en el formato de Estados Unidos
  // "1,250" son mil doscientos cincuenta, y aquí serían uno con veinticinco.
  it.each([
    '1250.50',
    '1,250.50',
    '1,250',
    '1.25',
    '12.50.000',
    'abc',
    '-5',
    '1 250',
  ])('en dólares %j no sigue el formato', (text) => {
    expect(parseAmount(text, 'USD')).toEqual({ error: AMOUNT_FORMAT_MESSAGE });
  });

  it('en pesos los centavos se marcan sin redondear', () => {
    expect(parseAmount('710.000,50', 'COP')).toEqual({
      error: CENTS_IN_PESOS_MESSAGE,
    });
  });

  it.each(['0', '0,00', '000'])('%j no es un valor mayor que cero', (text) => {
    expect(parseAmount(text, 'USD')).toEqual({ error: NOT_POSITIVE_MESSAGE });
  });

  it.each([
    ['1.000.000.000.000', 'COP'],
    ['999.999.999.999,01', 'USD'],
  ] as const)('%j en %s es demasiado grande', (text, currency) => {
    expect(parseAmount(text, currency)).toEqual({
      error: AMOUNT_TOO_LARGE_MESSAGE,
    });
  });
});

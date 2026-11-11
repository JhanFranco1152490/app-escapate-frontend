import { describe, expect, it } from 'vitest';

import {
  formatAmountInput,
  formatMoney,
  formatPercentage,
  formatRateAmount,
} from './money';

describe('formatMoney', () => {
  // Intl separa el signo del monto con un espacio no separable (U+00A0): el monto no se
  // parte en dos líneas.
  it.each([
    [1_250_000, '$ 1.250.000'],
    [0, '$ 0'],
    [999, '$ 999'],
    [-5000, '-$ 5.000'],
  ])('formatea %d como pesos', (amount, expected) => {
    expect(formatMoney(amount)).toBe(expected);
  });

  it('rechaza montos con decimales en vez de redondearlos en silencio', () => {
    expect(() => formatMoney(1250.5)).toThrow();
  });
});

describe('formatRateAmount', () => {
  it.each([
    ['710000', 'COP', '$ 710.000'],
    ['1250.50', 'USD', 'US$ 1.250,50'],
    ['1250', 'USD', 'US$ 1.250,00'],
    ['999999999999.99', 'USD', 'US$ 999.999.999.999,99'],
  ] as const)('muestra %j en %s como %j', (amount, currency, expected) => {
    expect(formatRateAmount(amount, currency)).toBe(expected);
  });
});

describe('formatAmountInput', () => {
  it.each([
    ['710000', 'COP', '710.000'],
    ['999999999999', 'COP', '999.999.999.999'],
    ['1250.50', 'USD', '1.250,50'],
    ['1250.5', 'USD', '1.250,50'],
    ['1250', 'USD', '1.250,00'],
    ['0.99', 'USD', '0,99'],
  ] as const)('escribe %j en %s como %j', (amount, currency, expected) => {
    expect(formatAmountInput(amount, currency)).toBe(expected);
  });
});

describe('formatPercentage', () => {
  it('muestra el porcentaje que llega como string decimal', () => {
    expect(formatPercentage('12.50')).toBe('12,5 %');
    expect(formatPercentage('15')).toBe('15 %');
  });
});

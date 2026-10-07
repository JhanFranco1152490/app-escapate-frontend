import { describe, expect, it } from 'vitest';

import { formatMoney, formatPercentage } from './money';

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

describe('formatPercentage', () => {
  it('muestra el porcentaje que llega como string decimal', () => {
    expect(formatPercentage('12.50')).toBe('12,5 %');
    expect(formatPercentage('15')).toBe('15 %');
  });
});

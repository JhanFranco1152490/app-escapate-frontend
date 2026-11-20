import { describe, expect, it } from 'vitest';

import { PERCENT_FORMAT_MESSAGE, parsePercent, percentInput } from './percent';

const range = { min: 0, max: 100 };

describe('parsePercent', () => {
  it.each([
    ['15', '15'],
    ['12,5', '12.5'],
    ['12.5', '12.5'],
    [' 30 % ', '30'],
    ['007', '7'],
  ])('lee %s como %s', (text, value) => {
    expect(parsePercent(text, range)).toEqual({ value });
  });

  it.each(['', 'quince', '12,555', '1.000', '-5'])('rechaza %j', (text) => {
    expect(parsePercent(text, range)).toEqual({
      error: PERCENT_FORMAT_MESSAGE,
    });
  });

  it('respeta los límites', () => {
    expect(parsePercent('120', range)).toHaveProperty('error');
    expect(
      parsePercent('0', { min: 0, max: 100, minInclusive: false }),
    ).toHaveProperty('error');
    expect(parsePercent('0', range)).toEqual({ value: '0' });
  });
});

describe('percentInput', () => {
  it('escribe el porcentaje de la API como se lee en el campo', () => {
    expect(percentInput('15.00')).toBe('15');
    expect(percentInput('12.50')).toBe('12,5');
    expect(percentInput(null)).toBe('');
  });
});

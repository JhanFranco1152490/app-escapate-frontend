import { describe, expect, it } from 'vitest';

import { formatAge } from './age';

describe('formatAge', () => {
  it('usa el singular solo con un año', () => {
    expect(formatAge(1)).toBe('1 año');
  });

  it.each([
    [0, '0 años'],
    [2, '2 años'],
    [17, '17 años'],
  ])('escribe %s como %s', (age, expected) => {
    expect(formatAge(age)).toBe(expected);
  });
});

import { describe, expect, it } from 'vitest';

import { parseRouteId } from './route-id';

describe('parseRouteId', () => {
  it('acepta un entero positivo', () => {
    expect(parseRouteId('7')).toBe(7);
    expect(parseRouteId('9007199254740991')).toBe(9007199254740991);
  });

  it.each(['0', '-3', '07', '1.5', 'abc', '', ' 7', '9007199254740992'])(
    'rechaza %j',
    (value) => {
      expect(parseRouteId(value)).toBeNull();
    },
  );
});

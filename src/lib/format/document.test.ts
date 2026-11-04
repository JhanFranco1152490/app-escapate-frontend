import { describe, expect, it } from 'vitest';

import { formatDocument } from './document';

describe('formatDocument', () => {
  it.each([
    ['CC', '1020304050', 'CC 1.020.304.050'],
    ['CC', '12345', 'CC 12.345'],
    ['NIT', '9001234568', 'NIT 900.123.456-8'],
    ['NIT', '800197263', 'NIT 80.019.726-3'],
    ['TI', '1090123456', 'TI 1090123456'],
    ['RC', 'A1234567B', 'RC A1234567B'],
    ['CE', 'AB12345', 'CE AB12345'],
    ['PPT', '123456789', 'PPT 123456789'],
    ['PA', 'AB123456', 'PA AB123456'],
    ['FOREIGN', 'A1234567', 'Id. extranjera A1234567'],
  ])('%s %s → %s', (type, number, expected) => {
    expect(formatDocument(type, number)).toBe(expected);
  });

  it('sin documento devuelve null', () => {
    expect(formatDocument(null, null)).toBeNull();
  });
});

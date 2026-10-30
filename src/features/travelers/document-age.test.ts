import { describe, expect, it } from 'vitest';

import { documentAgeWarning } from './document-age';

const TODAY = '2026-10-26';

describe('documentAgeWarning', () => {
  it('avisa una TI de alguien que ya cumplió 18', () => {
    expect(documentAgeWarning('TI', '2008-10-26', TODAY)).toBe(
      'Revisa el tipo de documento: por la edad, normalmente correspondería CC.',
    );
  });

  it('no avisa una TI el día antes de cumplir 18', () => {
    expect(documentAgeWarning('TI', '2008-10-27', TODAY)).toBeUndefined();
  });

  it('avisa un RC de alguien con 7 años o más', () => {
    expect(documentAgeWarning('RC', '2019-10-26', TODAY)).toBe(
      'Revisa el tipo de documento: por la edad, normalmente correspondería TI.',
    );
    expect(documentAgeWarning('RC', '2019-10-27', TODAY)).toBeUndefined();
  });

  it('no avisa otros tipos, ni sin fecha, ni con una fecha futura', () => {
    expect(documentAgeWarning('CC', '1960-01-01', TODAY)).toBeUndefined();
    expect(documentAgeWarning('TI', '', TODAY)).toBeUndefined();
    expect(documentAgeWarning('TI', '2027-01-01', TODAY)).toBeUndefined();
  });
});

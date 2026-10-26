import { describe, expect, it } from 'vitest';

import { COUNTRY_CODES, countryName, countryOptions } from './countries';

describe('countryOptions', () => {
  it('trae un país por cada código, con Colombia primero', () => {
    const options = countryOptions();

    expect(options).toHaveLength(COUNTRY_CODES.length);
    expect(options[0]).toEqual({ code: 'CO', name: 'Colombia' });
  });

  it('ordena los demás por nombre sin importar las tildes', () => {
    const names = countryOptions()
      .slice(1)
      .map((option) => option.name);
    const collator = new Intl.Collator('es', { sensitivity: 'base' });

    expect([...names].sort(collator.compare)).toEqual(names);
    expect(names.indexOf('Perú')).toBeLessThan(names.indexOf('Polonia'));
  });
});

describe('countryName', () => {
  it('da el nombre en español', () => {
    expect(countryName('VE')).toBe('Venezuela');
    expect(countryName('US')).toBe('Estados Unidos');
  });
});

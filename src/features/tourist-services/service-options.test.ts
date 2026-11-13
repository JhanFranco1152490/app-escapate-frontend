import { describe, expect, it } from 'vitest';

import { SUPPLIER_CATEGORIES } from '@/features/suppliers/categories';

import { CHARGE_UNITS } from './rate-options';
import { LODGING_INCLUDE_LABELS, optionsOf } from './service-options';

describe('opciones fijas', () => {
  it('las opciones salen en el orden de la API', () => {
    expect(optionsOf(LODGING_INCLUDE_LABELS).map(({ value }) => value)).toEqual(
      ['airport_transfers', 'recreational_activities', 'wifi', 'parking'],
    );
  });

  it('cada tipo tiene al menos una unidad de cobro para traer elegida', () => {
    for (const type of SUPPLIER_CATEGORIES) {
      expect(CHARGE_UNITS[type].length).toBeGreaterThan(0);
    }
    expect(CHARGE_UNITS.lodging[0]).toBe('per_night');
    expect(CHARGE_UNITS.other[0]).toBe('per_service');
  });
});

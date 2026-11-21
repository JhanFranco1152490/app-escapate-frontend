import { describe, expect, it } from 'vitest';

import { reportToCsv } from './csv';

describe('reportToCsv', () => {
  it('separa con punto y coma, empieza con BOM y protege los valores raros', () => {
    const csv = reportToCsv({
      title: 'Ventas',
      columns: ['Venta', 'Cliente', 'Total', 'Salida'],
      rows: [
        ['VEN-0001', 'Agencia "Demo"; SAS', 1_150_000, null],
        ['VEN-0002', 'Marcela Gómez', 900_000, '2026-12-18'],
      ],
    });

    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv.slice(1).split('\r\n')).toEqual([
      'Venta;Cliente;Total;Salida',
      'VEN-0001;"Agencia ""Demo""; SAS";1150000;',
      'VEN-0002;Marcela Gómez;900000;2026-12-18',
    ]);
  });
});

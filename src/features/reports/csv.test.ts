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

  // Excel ejecuta como fórmula una celda de texto que empieza por estos caracteres: un nombre
  // de cliente o una descripción escritos así correrían al abrir el archivo.
  it.each([
    ['=HYPERLINK("http://x";"y")', `"'=HYPERLINK(""http://x"";""y"")"`],
    ['+1+1', "'+1+1"],
    ['-2+3', "'-2+3"],
    ['@SUM(A1)', "'@SUM(A1)"],
    ['\t=1', "'\t=1"],
  ])('no deja que el texto %j se ejecute como fórmula', (text, expected) => {
    const csv = reportToCsv({
      title: 'Gastos',
      columns: ['Descripción'],
      rows: [[text]],
    });

    expect(csv.slice(1).split('\r\n')[1]).toBe(expected);
  });

  it('deja intactos los números negativos y el texto que no empieza por esos caracteres', () => {
    const csv = reportToCsv({
      title: 'Caja',
      columns: ['Mes', 'Neto', 'Nota'],
      rows: [['2026-11', -150_000, 'Pago - hotel = 2 noches']],
    });

    expect(csv.slice(1).split('\r\n')[1]).toBe(
      '2026-11;-150000;Pago - hotel = 2 noches',
    );
  });
});

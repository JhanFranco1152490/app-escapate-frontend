import { describe, expect, it } from 'vitest';

import { safeNext, withSearchParam } from './safe-next';

describe('safeNext', () => {
  it.each(['/', '/clientes', '/cotizaciones/12?tab=pagos#resumen'])(
    'acepta la ruta interna %s',
    (path) => {
      expect(safeNext(path)).toBe(path);
    },
  );

  it.each([
    ['otro sitio con //', '//evil.example'],
    ['URL absoluta', 'https://evil.example'],
    ['barra invertida', '/\\evil.example'],
    ['salto de línea', '/clientes\n/evil'],
    ['tabulador', '/\t/evil.example'],
    ['carácter DEL', '/clientes\u007f'],
    ['ruta relativa', 'clientes'],
    ['espacio al inicio', ' /clientes'],
    ['vacío', ''],
  ])('cambia %s por /', (_, value) => {
    expect(safeNext(value)).toBe('/');
  });

  it('cambia la ausencia de valor por /', () => {
    expect(safeNext(null)).toBe('/');
    expect(safeNext(undefined)).toBe('/');
  });

  it('usa el valor de reemplazo que se le pida', () => {
    expect(safeNext('//evil.example', '')).toBe('');
    expect(safeNext(null, '/clientes/7')).toBe('/clientes/7');
    expect(safeNext('/solicitudes/nueva', '')).toBe('/solicitudes/nueva');
  });
});

describe('withSearchParam', () => {
  it.each([
    ['/solicitudes/nueva', '/solicitudes/nueva?client_id=21'],
    ['/solicitudes/nueva?client_id=3', '/solicitudes/nueva?client_id=21'],
    [
      '/solicitudes?status=new#lista',
      '/solicitudes?status=new&client_id=21#lista',
    ],
  ])('agrega o reemplaza el parámetro en %s', (path, expected) => {
    expect(withSearchParam(path, 'client_id', '21')).toBe(expected);
  });
});

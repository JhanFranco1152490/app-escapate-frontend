import { describe, expect, it } from 'vitest';

import { safeNext } from './safe-next';

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
});

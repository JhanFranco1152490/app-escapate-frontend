import { describe, expect, it } from 'vitest';

import {
  REQUIRED_MESSAGE,
  optionalMultilineText,
  optionalText,
  requiredText,
} from './text';

const firstError = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

describe('requiredText', () => {
  const schema = requiredText(10);

  it('recorta los espacios', () => {
    expect(schema.parse('  Ventas  ')).toBe('Ventas');
  });

  it.each(['', '   '])('vacío (%j) es obligatorio', (value) => {
    expect(firstError(schema.safeParse(value))).toBe(REQUIRED_MESSAGE);
  });

  it('rechaza lo que pasa del largo', () => {
    expect(firstError(schema.safeParse('a'.repeat(11)))).toBe(
      'Máximo 10 caracteres.',
    );
  });

  it.each(['Ven\u0000tas', 'Ven​tas', 'Ven\ntas'])(
    'rechaza caracteres de control o invisibles (%j)',
    (value) => {
      expect(firstError(schema.safeParse(value))).toBe(
        'Contiene caracteres que no se permiten.',
      );
    },
  );

  it('descarta un BOM al inicio o al final', () => {
    expect(schema.parse('﻿Ventas﻿')).toBe('Ventas');
  });
});

describe('optionalText', () => {
  const schema = optionalText(10);

  it.each(['', '   '])('vacío (%j) queda en null', (value) => {
    expect(schema.parse(value)).toBeNull();
  });

  it('recorta y conserva el texto', () => {
    expect(schema.parse(' Clientes ')).toBe('Clientes');
  });

  it('rechaza lo que pasa del largo y los caracteres de control', () => {
    expect(firstError(schema.safeParse('a'.repeat(11)))).toBe(
      'Máximo 10 caracteres.',
    );
    expect(firstError(schema.safeParse('a\u0007b'))).toBe(
      'Contiene caracteres que no se permiten.',
    );
  });
});

describe('optionalMultilineText', () => {
  const schema = optionalMultilineText(10);

  it.each(['', '   ', '\n\n'])('vacío (%j) queda en null', (value) => {
    expect(schema.parse(value)).toBeNull();
  });

  it('acepta varias líneas y recorta solo el principio y el final', () => {
    expect(schema.parse('  Mar\nHotel  ')).toBe('Mar\nHotel');
  });

  it('convierte los saltos de Windows y los retornos sueltos en saltos de línea', () => {
    expect(schema.parse('a\r\nb\rc')).toBe('a\nb\nc');
  });

  it('cuenta el largo después de convertir los saltos', () => {
    // Con \r\n serían 11 caracteres; convertido son 10.
    expect(schema.parse('abcd\r\nefgh!')).toBe('abcd\nefgh!');
    expect(firstError(schema.safeParse('abcde\nefghi'))).toBe(
      'Máximo 10 caracteres.',
    );
  });

  it.each(['a\tb', 'a\u0000b', 'a​b'])(
    'rechaza los demás caracteres de control o invisibles (%j)',
    (value) => {
      expect(firstError(schema.safeParse(value))).toBe(
        'Contiene caracteres que no se permiten.',
      );
    },
  );
});

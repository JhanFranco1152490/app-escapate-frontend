import { describe, expect, it } from 'vitest';

import {
  documentNumberError,
  isValidDocument,
  nitCheckDigit,
  normalizeDocument,
} from './document';

describe('normalizeDocument', () => {
  it('quita espacios, puntos y guiones y pasa a mayúsculas', () => {
    expect(normalizeDocument(' 1.090-123 456 ')).toBe('1090123456');
    expect(normalizeDocument('ab-12.345')).toBe('AB12345');
  });
});

describe('isValidDocument', () => {
  it.each([
    ['CC', '12345'],
    ['CC', '1090123456'],
    ['CE', 'AB123'],
    ['PPT', '12345678901234567890'],
    ['PA', 'AB123456'],
    ['TI', '1090123456'],
    ['TI', '10901234567'],
    ['RC', '12345678'],
    ['RC', 'A1234567B'],
    ['NIT', '9001234568'],
    ['NIT', '800197263'],
    ['FOREIGN', 'ABC'],
    ['FOREIGN', '123456789012345678901234567890'],
  ])('%s %s es válido', (type, number) => {
    expect(isValidDocument(type, number)).toBe(true);
  });

  it.each([
    ['CC', '1234'],
    ['CC', '12345678901'],
    ['CC', '12345A'],
    ['CE', 'AB12'],
    ['PA', '123456789012345678901'],
    ['TI', '109012345'],
    ['TI', '109012345678'],
    ['RC', '1234567'],
    ['RC', '1234567890123456'],
    ['NIT', '9001234561'],
    ['NIT', '90012345'],
    ['FOREIGN', 'AB'],
    ['FOREIGN', '1234567890123456789012345678901'],
    ['FOREIGN', 'AB-12'],
    ['XX', '12345'],
  ])('%s %s no es válido', (type, number) => {
    expect(isValidDocument(type, number)).toBe(false);
  });

  it('no acepta dígitos de otros alfabetos', () => {
    expect(isValidDocument('CC', '١٢٣٤٥٦')).toBe(false);
  });
});

describe('nitCheckDigit', () => {
  it.each([
    ['900123456', 8],
    ['80019726', 3],
    ['890900608', 9],
  ])('el dígito de %s es %i', (base, digit) => {
    expect(nitCheckDigit(base)).toBe(digit);
  });
});

describe('documentNumberError', () => {
  it('no marca error en un número válido escrito con puntos y guion', () => {
    expect(documentNumberError('NIT', '900.123.456-8')).toBeUndefined();
    expect(documentNumberError('CC', '1.090.123.456')).toBeUndefined();
  });

  it('da un mensaje propio al NIT con el dígito de verificación equivocado', () => {
    expect(documentNumberError('NIT', '900.123.456-1')).toBe(
      'El dígito de verificación del NIT no coincide.',
    );
  });

  it('da el mensaje general a un número con la forma equivocada', () => {
    expect(documentNumberError('NIT', '900.123')).toBe(
      'No es válido para ese tipo.',
    );
    expect(documentNumberError('TI', '123')).toBe(
      'No es válido para ese tipo.',
    );
  });

  it('el dígito equivocado solo cuenta para el NIT', () => {
    // Un número de 10 dígitos con la forma de un NIT es una TI válida.
    expect(documentNumberError('TI', '9001234561')).toBeUndefined();
  });
});

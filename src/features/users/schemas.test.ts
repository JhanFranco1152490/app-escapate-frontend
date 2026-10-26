import { describe, expect, it } from 'vitest';

import { createUserSchema, normalizePhone, userSchema } from './schemas';

const valid = {
  first_name: 'Laura',
  last_name: 'Rojas',
  email: 'laura.rojas@example.com',
  document_type: 'CC',
  document_number: '1090123456',
  phone: '3001234567',
} as const;

const errorsOf = (values: Record<string, unknown>) => {
  const result = userSchema.safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join('.'), issue.message]),
  );
};

describe('normalizePhone', () => {
  it.each([
    ['300 123 4567'],
    ['300-123-4567'],
    ['(300) 1234567'],
    ['300.123.4567'],
    ['+57 300 123 4567'],
    ['573001234567'],
  ])('%s → 3001234567', (input) => {
    expect(normalizePhone(input)).toBe('3001234567');
  });

  it('no quita un 57 inicial de un número de 10 dígitos', () => {
    expect(normalizePhone('5712345678')).toBe('5712345678');
  });
});

describe('userSchema', () => {
  it('acepta datos válidos y devuelve documento, celular y correo normalizados', () => {
    const result = userSchema.parse({
      ...valid,
      first_name: '  Laura ',
      email: ' Laura.Rojas@Example.com ',
      document_number: '1.090.123.456',
      phone: '+57 300 123 4567',
    });

    expect(result).toEqual({
      ...valid,
      first_name: 'Laura',
    });
  });

  it('marca como obligatorios los campos vacíos', () => {
    const errors = errorsOf({
      ...valid,
      first_name: '  ',
      last_name: '',
      email: '',
      document_number: '',
      phone: '',
    });

    expect(errors).toEqual({
      first_name: 'Este campo es obligatorio.',
      last_name: 'Este campo es obligatorio.',
      email: 'Este campo es obligatorio.',
      document_number: 'Este campo es obligatorio.',
      phone: 'Este campo es obligatorio.',
    });
  });

  it('limita nombres y apellidos a 75 caracteres', () => {
    expect(errorsOf({ ...valid, last_name: 'a'.repeat(76) })).toEqual({
      last_name: 'Máximo 75 caracteres.',
    });
  });

  it.each([
    ['un NUL', 'Lau\u0000ra'],
    ['un salto de línea', 'Lau\nra'],
    ['un espacio de ancho cero', 'Lau\u200bra'],
    ['un cambio de dirección del texto', 'Laura\u202e'],
    ['un guion blando', 'Lau\u00adra'],
    ['una marca de orden de bytes en medio', 'Lau\ufeffra'],
  ])('rechaza en el nombre %s', (_description, first_name) => {
    expect(errorsOf({ ...valid, first_name })).toEqual({
      first_name: 'Contiene caracteres que no se permiten.',
    });
  });

  it.each([['laura@'], ['laura.example.com'], ['laurá@example.com']])(
    'rechaza el correo %s',
    (email) => {
      expect(errorsOf({ ...valid, email })).toEqual({
        email: 'No es un correo válido.',
      });
    },
  );

  it.each([
    ['CC', '1234'],
    ['CC', '12345678901'],
    ['CC', 'AB12345'],
    ['PA', 'AB12'],
    ['CE', 'A'.repeat(21)],
  ])('rechaza el documento %s %s', (document_type, document_number) => {
    expect(errorsOf({ ...valid, document_type, document_number })).toEqual({
      document_number: 'No es válido para ese tipo.',
    });
  });

  it('acepta letras en un pasaporte', () => {
    expect(
      errorsOf({ ...valid, document_type: 'PA', document_number: 'ab123456' }),
    ).toEqual({});
  });

  it('revisa el documento aunque otro campo tenga error', () => {
    expect(
      errorsOf({ ...valid, first_name: '', document_number: '12' }),
    ).toEqual({
      first_name: 'Este campo es obligatorio.',
      document_number: 'No es válido para ese tipo.',
    });
  });

  it.each([['6012345678'], ['300123456'], ['30012345678'], ['300abc4567']])(
    'rechaza el celular %s',
    (phone) => {
      expect(errorsOf({ ...valid, phone })).toEqual({
        phone: 'Debe ser un celular colombiano de 10 dígitos.',
      });
    },
  );
});

describe('createUserSchema', () => {
  it('exige un rol y lo devuelve como número', () => {
    expect(createUserSchema.parse({ ...valid, role_id: '3' }).role_id).toBe(3);

    const result = createUserSchema.safeParse({ ...valid, role_id: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: ['role_id'],
      message: 'Selecciona un rol.',
    });
  });
});

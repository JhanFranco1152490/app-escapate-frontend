import { describe, expect, it } from 'vitest';

import { EMPTY_SUPPLIER_FORM } from './form-values';
import {
  CATEGORIES_REQUIRED_MESSAGE,
  CONTACT_REQUIRED_MESSAGE,
  DOCUMENT_NUMBER_REQUIRED_MESSAGE,
  DOCUMENT_TYPE_REQUIRED_MESSAGE,
  INVALID_COMMISSION_MESSAGE,
  supplierFormSchema,
  type SupplierFormValues,
} from './schemas';

const valid: SupplierFormValues = {
  ...EMPTY_SUPPLIER_FORM,
  trade_name: 'Hotel Costa Azul',
  categories: ['lodging'],
  contact_name: 'Mónica Salas',
  contact_email: 'ventas@example.com',
};

const parse = (overrides: Partial<SupplierFormValues> = {}) =>
  supplierFormSchema.safeParse({ ...valid, ...overrides });

// El primer mensaje de cada campo con error.
const errorsOf = (overrides: Partial<SupplierFormValues>) => {
  const result = parse(overrides);
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path[0], issue.message]),
  );
};

describe('supplierFormSchema', () => {
  it('con lo mínimo envía los demás campos como null', () => {
    const result = parse();

    expect(result.data).toEqual({
      trade_name: 'Hotel Costa Azul',
      legal_name: null,
      document_type: null,
      document_number: null,
      categories: ['lodging'],
      city: null,
      coverage_zone: null,
      contact_name: 'Mónica Salas',
      contact_role: null,
      contact_phone: null,
      contact_email: 'ventas@example.com',
      payment_terms: null,
      commission_rate: null,
      agreement_valid_until: null,
      notes: null,
    });
  });

  it('recorta, normaliza el documento y pasa el teléfono a E.164', () => {
    const result = parse({
      trade_name: '  Hotel Costa Azul ',
      document_type: 'NIT',
      document_number: '800.111.222-7',
      contact_phone: '300 111 2233',
      contact_email: ' Ventas@Example.com ',
      commission_rate: '10,5',
      agreement_valid_until: '2027-06-30',
    });

    expect(result.data).toMatchObject({
      trade_name: 'Hotel Costa Azul',
      document_type: 'NIT',
      document_number: '8001112227',
      contact_phone: '+573001112233',
      contact_email: 'ventas@example.com',
      commission_rate: '10.5',
      agreement_valid_until: '2027-06-30',
    });
  });

  it('envía las categorías en el orden fijo', () => {
    const result = parse({ categories: ['other', 'air', 'lodging'] });

    expect(result.data?.categories).toEqual(['lodging', 'air', 'other']);
  });

  it('exige nombre comercial, persona de contacto y una clasificación', () => {
    expect(
      errorsOf({ trade_name: '  ', contact_name: '', categories: [] }),
    ).toEqual({
      trade_name: 'Este campo es obligatorio.',
      contact_name: 'Este campo es obligatorio.',
      categories: CATEGORIES_REQUIRED_MESSAGE,
    });
  });

  describe('contacto', () => {
    it('sin teléfono ni correo marca los dos campos', () => {
      expect(errorsOf({ contact_email: ' ', contact_phone: '' })).toEqual({
        contact_phone: CONTACT_REQUIRED_MESSAGE,
        contact_email: CONTACT_REQUIRED_MESSAGE,
      });
    });

    it('solo con teléfono es válido', () => {
      expect(
        parse({ contact_email: '', contact_phone: '3001112233' }).success,
      ).toBe(true);
    });

    it('un correo mal escrito sin teléfono marca solo el correo', () => {
      expect(errorsOf({ contact_email: 'nadie' })).toEqual({
        contact_email: 'No es un correo válido.',
      });
    });

    it('un teléfono inválido para su país marca solo el teléfono', () => {
      expect(errorsOf({ contact_email: '', contact_phone: '12' })).toEqual({
        contact_phone: 'No es un teléfono válido para ese país.',
      });
    });
  });

  describe('documento', () => {
    it('el tipo y el número van juntos', () => {
      expect(errorsOf({ document_type: 'CC' })).toEqual({
        document_number: DOCUMENT_NUMBER_REQUIRED_MESSAGE,
      });
      expect(errorsOf({ document_number: '123456' })).toEqual({
        document_number: DOCUMENT_TYPE_REQUIRED_MESSAGE,
      });
    });

    it('un NIT con el dígito de verificación equivocado se rechaza', () => {
      expect(
        errorsOf({ document_type: 'NIT', document_number: '800111222-4' }),
      ).toEqual({
        document_number: 'El dígito de verificación del NIT no coincide.',
      });
    });

    it('una identificación extranjera pierde el guion', () => {
      const result = parse({
        document_type: 'FOREIGN',
        document_number: 'ab-123456',
      });

      expect(result.data).toMatchObject({
        document_type: 'FOREIGN',
        document_number: 'AB123456',
      });
    });
  });

  describe('comisión', () => {
    it.each(['0', '100', '99.99', '7,5'])('acepta %s', (commission_rate) => {
      expect(parse({ commission_rate }).success).toBe(true);
    });

    it.each(['101', '-1', '10.555', 'diez', '1e2'])(
      'rechaza %s',
      (commission_rate) => {
        expect(errorsOf({ commission_rate })).toEqual({
          commission_rate: INVALID_COMMISSION_MESSAGE,
        });
      },
    );
  });

  it('respeta los largos máximos de la API', () => {
    expect(
      errorsOf({
        trade_name: 'x'.repeat(151),
        payment_terms: 'x'.repeat(501),
        notes: 'x'.repeat(2001),
      }),
    ).toEqual({
      trade_name: 'Máximo 150 caracteres.',
      payment_terms: 'Máximo 500 caracteres.',
      notes: 'Máximo 2000 caracteres.',
    });
  });
});

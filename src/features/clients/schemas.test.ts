import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildClientDetail, buildCompanyDetail } from '@/test/clients';

import { EMPTY_CLIENT_FORM, clientFormValues } from './form-values';
import { clientFormSchema, type ClientFormValues } from './schemas';

const createSchema = clientFormSchema({ requireConsent: true });
const editSchema = clientFormSchema({ requireConsent: false });

const person: ClientFormValues = {
  ...EMPTY_CLIENT_FORM,
  first_name: ' Marcela ',
  last_name: 'Gómez Ortiz',
  phone: '300 111 2233',
  contact_source: 'whatsapp',
  data_consent: true,
};

const company: ClientFormValues = {
  ...EMPTY_CLIENT_FORM,
  client_type: 'company',
  business_name: 'Viajes Andinos S.A.S.',
  document_type: 'NIT',
  document_number: '900.123.456-8',
  phone: '607 555 1234',
  contact_source: 'google',
  data_consent: true,
};

const errorsOf = (values: ClientFormValues, schema = createSchema) => {
  const result = schema.safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join('.'), issue.message]),
  );
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-26T15:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('clientFormSchema: persona', () => {
  it('arma el cuerpo de la API con el teléfono en E.164 y los vacíos en null', () => {
    expect(createSchema.parse(person)).toEqual({
      client_type: 'person',
      first_name: 'Marcela',
      last_name: 'Gómez Ortiz',
      business_name: null,
      document_type: null,
      document_number: null,
      birth_date: null,
      phone: '+573001112233',
      email: null,
      city: null,
      contact_source: 'whatsapp',
      contact_source_detail: null,
      notes: null,
    });
  });

  it('envía el documento sin formato y el correo en minúsculas', () => {
    const payload = createSchema.parse({
      ...person,
      document_type: 'CE',
      document_number: 'ab-12.345',
      email: ' Marcela.Gomez@Example.com ',
      birth_date: '1988-04-15',
    });

    expect(payload).toMatchObject({
      document_type: 'CE',
      document_number: 'AB12345',
      email: 'marcela.gomez@example.com',
      birth_date: '1988-04-15',
    });
  });

  it('marca cada obligatorio que falta', () => {
    expect(
      errorsOf({
        ...EMPTY_CLIENT_FORM,
        first_name: '  ',
      }),
    ).toEqual({
      first_name: 'Este campo es obligatorio.',
      last_name: 'Este campo es obligatorio.',
      phone: 'Este campo es obligatorio.',
      contact_source: 'Este campo es obligatorio.',
      data_consent:
        'Confirma que el cliente autorizó el tratamiento de sus datos.',
    });
  });

  it('valida formatos: documento, teléfono, correo y fecha', () => {
    expect(
      errorsOf({
        ...person,
        document_number: '12',
        phone: '300 111 2233',
        phone_country: 'PE',
        email: 'no-es-correo',
        birth_date: '2026-10-27',
      }),
    ).toEqual({
      document_number: 'No es válido para ese tipo.',
      phone: 'No es un teléfono válido para ese país.',
      email: 'No es un correo válido.',
      birth_date: 'La fecha no puede ser futura.',
    });
  });

  it('acepta un teléfono de otro país con su país elegido', () => {
    expect(
      createSchema.parse({
        ...person,
        phone: '412 555 0101',
        phone_country: 'VE',
      }).phone,
    ).toBe('+584125550101');
  });

  it('no envía la razón social que quedó escrita antes de cambiar de tipo', () => {
    expect(
      createSchema.parse({ ...person, business_name: 'Quedó escrita' })
        .business_name,
    ).toBeNull();
  });
});

describe('clientFormSchema: empresa', () => {
  it('envía la razón social y el NIT, sin nombres ni fecha de nacimiento', () => {
    expect(
      createSchema.parse({
        ...company,
        first_name: 'Quedó escrito',
        birth_date: '1988-04-15',
      }),
    ).toMatchObject({
      client_type: 'company',
      first_name: null,
      last_name: null,
      business_name: 'Viajes Andinos S.A.S.',
      document_type: 'NIT',
      document_number: '9001234568',
      birth_date: null,
      phone: '+576075551234',
    });
  });

  it('exige la razón social y no los nombres', () => {
    expect(errorsOf({ ...company, business_name: '' })).toEqual({
      business_name: 'Este campo es obligatorio.',
    });
  });

  it('el NIT con el dígito de verificación equivocado tiene su propio mensaje', () => {
    expect(errorsOf({ ...company, document_number: '900.123.456-1' })).toEqual({
      document_number: 'El dígito de verificación del NIT no coincide.',
    });
  });

  it('sin documento no envía tipo ni número', () => {
    expect(
      createSchema.parse({ ...company, document_number: ' ' }),
    ).toMatchObject({ document_type: null, document_number: null });
  });
});

describe('clientFormSchema: medio de contacto y autorización', () => {
  it('"Otro" exige el detalle', () => {
    expect(errorsOf({ ...person, contact_source: 'other' })).toEqual({
      contact_source_detail: 'Cuéntanos cuál.',
    });
  });

  it('"Referido" acepta el detalle vacío', () => {
    expect(
      createSchema.parse({ ...person, contact_source: 'referral' })
        .contact_source_detail,
    ).toBeNull();
  });

  it('un medio sin detalle no envía lo que quedó escrito', () => {
    expect(
      createSchema.parse({
        ...person,
        contact_source: 'instagram',
        contact_source_detail: 'Quedó escrito',
      }).contact_source_detail,
    ).toBeNull();
  });

  it('las notas no aceptan saltos de línea, como la API', () => {
    expect(errorsOf({ ...person, notes: 'Primera\nSegunda' })).toEqual({
      notes: 'Contiene caracteres que no se permiten.',
    });
  });

  it('en la edición no pide la autorización', () => {
    expect(errorsOf({ ...person, data_consent: false }, editSchema)).toEqual(
      {},
    );
  });
});

describe('clientFormValues', () => {
  it('llena el formulario con la ficha, separando país y número', () => {
    expect(
      clientFormValues(buildClientDetail({ phone: '+584125550101' })),
    ).toMatchObject({
      client_type: 'person',
      first_name: 'Marcela',
      document_type: 'CC',
      document_number: '1020304050',
      phone_country: 'VE',
      phone: '4125550101',
      business_name: '',
      contact_source: 'whatsapp',
    });
  });

  it('una empresa sin documento queda con NIT como tipo', () => {
    expect(
      clientFormValues(
        buildCompanyDetail({ document_type: null, document_number: null }),
      ),
    ).toMatchObject({ document_type: 'NIT', document_number: '' });
  });
});

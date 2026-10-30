import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildClientAsTraveler,
  buildClientDetail,
  buildCompanyDetail,
  buildTravelerDetail,
} from '@/test/clients';

import {
  EMPTY_TRAVELER_FORM,
  fromClient,
  travelerFormValues,
  withReferenceClient,
} from './form-values';
import { travelerFormSchema, type TravelerFormValues } from './schemas';

const createSchema = travelerFormSchema({ requireConsent: true });
const editSchema = travelerFormSchema({ requireConsent: false });

const minor: TravelerFormValues = {
  ...EMPTY_TRAVELER_FORM,
  first_name: ' Sofía ',
  last_name: 'Gómez Ruiz',
  document_type: 'TI',
  document_number: '1.090.123.456',
  birth_date: '2014-03-12',
  data_consent: true,
};

const errorsOf = (values: TravelerFormValues, schema = createSchema) => {
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

describe('travelerFormSchema', () => {
  it('arma el cuerpo de la API con el documento sin formato', () => {
    expect(createSchema.parse(minor)).toEqual({
      first_name: 'Sofía',
      last_name: 'Gómez Ruiz',
      document_type: 'TI',
      document_number: '1090123456',
      birth_date: '2014-03-12',
      nationality: 'CO',
      reference_client_id: null,
      is_the_client: false,
      notes: null,
    });
  });

  it('marca cada obligatorio que falta', () => {
    expect(errorsOf(EMPTY_TRAVELER_FORM)).toEqual({
      first_name: 'Este campo es obligatorio.',
      last_name: 'Este campo es obligatorio.',
      document_number: 'Este campo es obligatorio.',
      birth_date: 'Este campo es obligatorio.',
      data_consent:
        'Confirma que el viajero, o su representante legal si es menor de edad, autorizó el tratamiento de sus datos.',
    });
  });

  it('valida el documento por tipo y la fecha', () => {
    expect(
      errorsOf({
        ...minor,
        document_type: 'RC',
        document_number: '123',
        birth_date: '2026-10-27',
      }),
    ).toEqual({
      document_number: 'No es válido para ese tipo.',
      birth_date: 'La fecha no puede ser futura.',
    });
  });

  it('rechaza una nacionalidad que no está en la lista', () => {
    expect(errorsOf({ ...minor, nationality: 'ZZ' })).toEqual({
      nationality: 'No es un país válido.',
    });
  });

  it('"es el mismo cliente" pide un cliente de referencia', () => {
    expect(errorsOf({ ...minor, is_the_client: true })).toEqual({
      is_the_client: 'Elige primero el cliente que también viaja.',
    });
  });

  it('envía el cliente de referencia elegido', () => {
    expect(
      createSchema.parse({
        ...withReferenceClient(buildClientDetail()),
        ...minor,
        reference_client_id: 12,
      }),
    ).toMatchObject({ reference_client_id: 12, is_the_client: false });
  });

  it('en la edición no pide la autorización', () => {
    expect(errorsOf({ ...minor, data_consent: false }, editSchema)).toEqual({});
  });
});

describe('fromClient', () => {
  it('copia de la persona lo que el viajero también necesita', () => {
    expect(fromClient(buildClientDetail())).toMatchObject({
      first_name: 'Marcela',
      last_name: 'Gómez Ortiz',
      document_type: 'CC',
      document_number: '1020304050',
      birth_date: '1988-04-15',
      reference_client_id: 12,
      reference_client_name: 'Marcela Gómez Ortiz',
      reference_client_type: 'person',
      is_the_client: true,
      data_consent: false,
    });
  });

  it('deja vacíos el documento y la fecha si el cliente no los tiene', () => {
    expect(
      fromClient(
        buildClientDetail({
          document_type: null,
          document_number: null,
          birth_date: null,
        }),
      ),
    ).toMatchObject({
      document_type: 'CC',
      document_number: '',
      birth_date: '',
    });
  });

  it('no copia un NIT, que no es un documento de viajero', () => {
    expect(fromClient(buildCompanyDetail())).toMatchObject({
      document_type: 'CC',
      document_number: '',
    });
  });
});

describe('travelerFormValues', () => {
  it('llena el formulario con la ficha y su cliente de referencia', () => {
    expect(travelerFormValues(buildTravelerDetail())).toMatchObject({
      first_name: 'Sofía',
      document_type: 'TI',
      reference_client_id: 12,
      reference_client_name: 'Marcela Gómez Ortiz',
      reference_client_type: null,
      is_the_client: false,
    });
  });

  it('si es "el mismo cliente", su cliente es una persona', () => {
    expect(travelerFormValues(buildClientAsTraveler())).toMatchObject({
      reference_client_type: 'person',
      is_the_client: true,
    });
  });

  it('sin cliente de referencia lo deja vacío', () => {
    expect(
      travelerFormValues(buildTravelerDetail({ reference_client: null })),
    ).toMatchObject({ reference_client_id: null, reference_client_name: '' });
  });
});

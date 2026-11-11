import { describe, expect, it } from 'vitest';

import { REQUIRED_MESSAGE } from '@/lib/validation/text';
import { buildServiceDetail } from '@/test/tourist-services';

import type { ServiceType } from './api';
import {
  EMPTY_ATTRIBUTES,
  emptyServiceForm,
  serviceFormValues,
} from './form-values';
import {
  MEALS_REQUIRED_MESSAGE,
  SERVICE_TYPE_REQUIRED_MESSAGE,
  serviceFormSchema,
  type ServiceFormValues,
} from './schemas';

// Las tablas de abajo van `as const`: sus listas llegan de solo lectura.
type AttributeOverrides = {
  [K in keyof ServiceFormValues['attributes']]?:
    ServiceFormValues['attributes'][K] | readonly string[];
};

const formFor = (
  service_type: ServiceType,
  attributes: AttributeOverrides = {},
): ServiceFormValues => ({
  ...emptyServiceForm(),
  service_type,
  name: '  Servicio de prueba ',
  destination: 'Cartagena',
  attributes: {
    ...EMPTY_ATTRIBUTES,
    ...attributes,
  } as ServiceFormValues['attributes'],
});

const parse = (values: ServiceFormValues) =>
  serviceFormSchema.safeParse(values);

const errorsOf = (values: ServiceFormValues) =>
  Object.fromEntries(
    (parse(values).error?.issues ?? []).map((issue) => [
      issue.path.join('.'),
      issue.message,
    ]),
  );

describe('serviceFormSchema', () => {
  it('sin tipo ni comunes dice qué falta', () => {
    expect(
      errorsOf({ ...formFor('lodging'), service_type: '', name: '' }),
    ).toEqual({
      service_type: SERVICE_TYPE_REQUIRED_MESSAGE,
      name: REQUIRED_MESSAGE,
    });
  });

  it('un alojamiento exige tipo y capacidad, y envía solo sus campos', () => {
    expect(errorsOf(formFor('lodging'))).toEqual({
      'attributes.lodging_kind': REQUIRED_MESSAGE,
      'attributes.max_capacity': REQUIRED_MESSAGE,
    });

    const result = parse(
      formFor('lodging', {
        lodging_kind: 'hotel',
        max_capacity: '4',
        check_in_time: '15:00',
        includes: ['wifi', 'airport_transfers'],
        // Quedó escrito de otro tipo: no se envía.
        ship_name: 'Barco',
      }),
    );

    expect(result.data).toEqual({
      service_type: 'lodging',
      name: 'Servicio de prueba',
      destination: 'Cartagena',
      description: null,
      conditions: null,
      attributes: {
        lodging_kind: 'hotel',
        stars: null,
        meal_plan: null,
        max_capacity: 4,
        check_in_time: '15:00',
        check_out_time: null,
        includes: ['airport_transfers', 'wifi'],
      },
    });
  });

  it.each([
    ['max_capacity', '51', 'Indica un número entero de 1 a 50.'],
    ['max_capacity', '2,5', 'Indica un número entero de 1 a 50.'],
    ['stars', '6', 'Indica un número entero de 1 a 5.'],
    ['check_in_time', '15:00:30', 'Indica la hora en horas y minutos.'],
  ] as const)('en un alojamiento %s = %j da %j', (field, value, message) => {
    const errors = errorsOf(
      formFor('lodging', {
        lodging_kind: 'hotel',
        max_capacity: '4',
        [field]: value,
      }),
    );

    expect(errors[`attributes.${field}`]).toBe(message);
  });

  it.each([
    [
      'air',
      { origin: 'Bogotá (BOG)', trip_type: 'round_trip' },
      {
        origin: 'Bogotá (BOG)',
        trip_type: 'round_trip',
        cabin_class: null,
        stops: null,
        carry_on_included: false,
        checked_bags: null,
      },
    ],
    [
      'ground',
      { modality: 'private' },
      {
        modality: 'private',
        vehicle_kind: null,
        origin: null,
        max_capacity: null,
      },
    ],
    [
      'tours',
      { duration_value: '8', duration_unit: 'hours' },
      {
        duration_value: 8,
        duration_unit: 'hours',
        modality: null,
        meeting_point: null,
        includes: [],
      },
    ],
    [
      'cruise',
      { ship_name: 'Brisa del Mar', departure_port: 'Miami', nights: '7' },
      {
        ship_name: 'Brisa del Mar',
        departure_port: 'Miami',
        nights: 7,
        cabin_kind: null,
        itinerary: null,
        includes: [],
      },
    ],
    [
      'food',
      { meals: ['dinner', 'breakfast'] },
      { meals: ['breakfast', 'dinner'], service_style: null, cuisine: null },
    ],
    [
      'wholesaler',
      { nights: '0' },
      { nights: 0, departure_city: null, includes: [] },
    ],
    ['other', {}, {}],
  ] as const)(
    '%s con sus mínimos envía sus atributos',
    (type, attributes, expected) => {
      expect(parse(formFor(type, attributes)).data?.attributes).toEqual(
        expected,
      );
    },
  );

  it.each([
    ['air', ['origin', 'trip_type']],
    ['ground', ['modality']],
    ['tours', ['duration_value']],
    ['cruise', ['ship_name', 'departure_port', 'nights']],
    ['wholesaler', ['nights']],
  ] as const)('%s exige %j', (type, fields) => {
    const values = formFor(type, { duration_unit: 'hours' });

    expect(Object.keys(errorsOf(values))).toEqual(
      fields.map((field) => `attributes.${field}`),
    );
  });

  it('alimentación exige al menos una comida', () => {
    expect(errorsOf(formFor('food'))).toEqual({
      'attributes.meals': MEALS_REQUIRED_MESSAGE,
    });
  });

  it('los textos con saltos de línea se marcan, como en la API', () => {
    const errors = errorsOf({
      ...formFor('other'),
      conditions: 'Primera línea\nSegunda línea',
    });

    expect(errors.conditions).toBe('Contiene caracteres que no se permiten.');
  });
});

describe('serviceFormValues', () => {
  it('llena el formulario con la ficha y vuelve a dar lo mismo', () => {
    const service = buildServiceDetail();
    const values = serviceFormValues(service);

    expect(values.attributes).toMatchObject({
      lodging_kind: 'hotel',
      stars: '4',
      max_capacity: '4',
      check_in_time: '15:00',
      includes: ['airport_transfers', 'wifi'],
    });
    expect(serviceFormSchema.parse(values)).toMatchObject({
      service_type: 'lodging',
      attributes: service.attributes,
    });
  });
});

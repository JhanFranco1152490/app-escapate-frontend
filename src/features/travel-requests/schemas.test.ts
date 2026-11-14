import { describe, expect, it } from 'vitest';

import { REQUIRED_MESSAGE } from '@/lib/validation/text';

import { emptyRequestForm } from './form-values';
import { travelRequestSchema, type RequestFormValues } from './schemas';

const TODAY = '2026-11-13';
const today = () => TODAY;

const valid = (overrides: Partial<RequestFormValues> = {}) => ({
  ...emptyRequestForm({
    client: { id: 7, name: 'Marcela Gómez Ortiz' },
    advisorId: 2,
  }),
  destination: 'San Andrés',
  departure_date: '2026-12-18',
  ...overrides,
});

const flexible = (overrides: Partial<RequestFormValues> = {}) =>
  valid({
    date_mode: 'flexible',
    window_start: '2026-12-01',
    window_end: '2026-12-31',
    ...overrides,
  });

const schema = (options: Parameters<typeof travelRequestSchema>[0] = {}) =>
  travelRequestSchema({ today, ...options });

function errorsOf(values: RequestFormValues, options = {}) {
  const result = schema(options).safeParse(values);
  return Object.fromEntries(
    (result.error?.issues ?? []).map((issue) => [
      issue.path.join('.'),
      issue.message,
    ]),
  );
}

describe('travelRequestSchema: cuerpo que se envía', () => {
  it('con fechas exactas envía solo las de ese modo', () => {
    const payload = schema().parse(
      valid({ return_date: '2026-12-24', window_start: '2026-12-01' }),
    );

    expect(payload).toEqual({
      client_id: 7,
      destination: 'San Andrés',
      origin: null,
      date_mode: 'exact',
      departure_date: '2026-12-18',
      return_date: '2026-12-24',
      adults: 1,
      minors: 0,
      budget_min: null,
      budget_max: null,
      trip_types: [],
      accommodation_category: null,
      assigned_to_id: 2,
      notes: null,
    });
  });

  it('con período flexible envía la ventana y las noches, no la salida', () => {
    const payload = schema().parse(flexible({ approx_nights: '5' }));

    expect(payload).toMatchObject({
      date_mode: 'flexible',
      window_start: '2026-12-01',
      window_end: '2026-12-31',
      approx_nights: 5,
    });
    expect(payload).not.toHaveProperty('departure_date');
    expect(payload).not.toHaveProperty('return_date');
  });

  it('convierte cantidades, presupuesto y listas', () => {
    const payload = schema().parse(
      valid({
        adults: '2',
        minors: '1',
        budget_min: '6.000.000',
        budget_max: '8000000',
        trip_types: ['family', 'leisure'],
        accommodation_category: 'four_star',
        origin: ' Cúcuta ',
        notes: 'Hotel cerca de la playa.\r\nCoche de bebé.',
      }),
    );

    expect(payload).toMatchObject({
      adults: 2,
      minors: 1,
      budget_min: 6_000_000,
      budget_max: 8_000_000,
      // En el orden de la lista, no en el que se marcaron.
      trip_types: ['leisure', 'family'],
      accommodation_category: 'four_star',
      origin: 'Cúcuta',
      notes: 'Hotel cerca de la playa.\nCoche de bebé.',
    });
  });

  it('acepta solo el mínimo o solo el máximo del presupuesto', () => {
    expect(schema().parse(valid({ budget_min: '5.000.000' }))).toMatchObject({
      budget_min: 5_000_000,
      budget_max: null,
    });
    expect(schema().parse(valid({ budget_max: '9.000.000' }))).toMatchObject({
      budget_min: null,
      budget_max: 9_000_000,
    });
  });
});

describe('travelRequestSchema: obligatorios', () => {
  it('marca cada obligatorio con su mensaje', () => {
    expect(
      errorsOf(
        valid({
          client_id: null,
          destination: ' ',
          departure_date: '',
          adults: '',
          assigned_to_id: '',
        }),
      ),
    ).toEqual({
      client_id: REQUIRED_MESSAGE,
      destination: REQUIRED_MESSAGE,
      departure_date: 'Indica la fecha de salida.',
      adults: 'Indica un número entero de 1 a 99.',
      assigned_to_id: REQUIRED_MESSAGE,
    });
  });

  it('en un período pide desde y hasta, y no la salida', () => {
    expect(
      errorsOf(
        flexible({ departure_date: '', window_start: '', window_end: '' }),
      ),
    ).toEqual({
      window_start: 'Indica desde cuándo.',
      window_end: 'Indica hasta cuándo.',
    });
  });
});

describe('travelRequestSchema: reglas entre campos', () => {
  it.each([
    [
      'regreso antes de la salida',
      valid({ return_date: '2026-12-10' }),
      { return_date: 'No puede ser anterior a la salida.' },
    ],
    [
      'hasta antes de desde',
      flexible({ window_end: '2026-11-30' }),
      { window_end: 'No puede ser anterior al inicio.' },
    ],
    [
      'noches que no caben en la ventana',
      flexible({ window_end: '2026-12-05', approx_nights: '5' }),
      { approx_nights: 'No caben en el período elegido.' },
    ],
    [
      'noches fuera de rango',
      flexible({ approx_nights: '0' }),
      { approx_nights: 'Indica un número entero de 1 a 365.' },
    ],
    [
      'menores fuera de rango',
      valid({ minors: '100' }),
      { minors: 'Indica un número entero de 0 a 99.' },
    ],
    [
      'presupuesto invertido',
      valid({ budget_min: '8.000.000', budget_max: '6.000.000' }),
      { budget_max: 'No puede ser menor que el mínimo.' },
    ],
    [
      'presupuesto con centavos',
      valid({ budget_min: '6.000.000,50' }),
      { budget_min: 'En pesos el valor va sin decimales.' },
    ],
    [
      'condiciones con un tabulador',
      valid({ notes: 'a\tb' }),
      { notes: 'Contiene caracteres que no se permiten.' },
    ],
  ])('%s', (_, values, expected) => {
    expect(errorsOf(values)).toEqual(expected);
  });
});

describe('travelRequestSchema: fechas en el pasado', () => {
  it('en el alta rechaza una salida o un hasta anteriores a hoy', () => {
    expect(errorsOf(valid({ departure_date: '2026-11-12' }))).toEqual({
      departure_date: 'La fecha ya pasó.',
    });
    expect(
      errorsOf(
        flexible({ window_start: '2026-11-01', window_end: '2026-11-12' }),
      ),
    ).toEqual({ window_end: 'La fecha ya pasó.' });
  });

  it('hoy todavía vale', () => {
    expect(errorsOf(valid({ departure_date: TODAY }))).toEqual({});
  });

  it('al editar acepta la fecha pasada que no cambió y rechaza la que cambió', () => {
    const original = { departure_date: '2026-11-01', window_end: null };

    expect(
      errorsOf(valid({ departure_date: '2026-11-01' }), { original }),
    ).toEqual({});
    expect(
      errorsOf(valid({ departure_date: '2026-11-02' }), { original }),
    ).toEqual({ departure_date: 'La fecha ya pasó.' });
  });
});

describe('travelRequestSchema: asesor responsable', () => {
  it('con la lista cargada rechaza un asesor que ya no está en ella', () => {
    expect(
      errorsOf(valid({ assigned_to_id: '9' }), { advisorIds: [2] }),
    ).toEqual({
      assigned_to_id: 'Elige un asesor activo que pueda gestionar solicitudes.',
    });
  });

  it('mientras la lista no carga no lo rechaza', () => {
    expect(errorsOf(valid({ assigned_to_id: '9' }))).toEqual({});
  });
});

import { describe, expect, it } from 'vitest';

import { buildTravelRequestListItem } from '@/test/travel-requests';

import {
  formatBudget,
  formatDeparture,
  formatTravelers,
  formatTripDates,
  formatWaiting,
} from './format';

const exact = (departure_date: string, return_date: string | null) =>
  buildTravelRequestListItem({ departure_date, return_date });

const flexible = (
  window_start: string,
  window_end: string,
  approx_nights: number | null,
) =>
  buildTravelRequestListItem({
    date_mode: 'flexible',
    departure_date: null,
    return_date: null,
    window_start,
    window_end,
    approx_nights,
  });

describe('formatTripDates', () => {
  it.each([
    [
      'exactas con regreso',
      exact('2026-12-18', '2026-12-24'),
      '18–24 dic 2026',
    ],
    [
      'exactas con cambio de año',
      exact('2026-12-28', '2027-01-03'),
      '28 dic 2026 – 3 ene 2027',
    ],
    ['exactas sin regreso', exact('2026-12-18', null), 'Salida 18 dic 2026'],
    [
      'período con noches',
      flexible('2026-12-01', '2026-12-31', 5),
      'Entre 1 dic y 31 dic 2026 · ~5 noches',
    ],
    [
      'período con una noche',
      flexible('2026-12-01', '2026-12-31', 1),
      'Entre 1 dic y 31 dic 2026 · ~1 noche',
    ],
    [
      'período sin noches',
      flexible('2026-12-01', '2026-12-31', null),
      'Entre 1 dic y 31 dic 2026',
    ],
    [
      'período con cambio de año',
      flexible('2026-12-20', '2027-01-10', null),
      'Entre 20 dic 2026 y 10 ene 2027',
    ],
  ])('%s', (_, request, expected) => {
    expect(formatTripDates(request)).toBe(expected);
  });
});

describe('formatDeparture', () => {
  it('da la salida o el inicio del período', () => {
    expect(formatDeparture(exact('2026-12-18', null))).toBe('18 dic 2026');
    expect(formatDeparture(flexible('2026-12-01', '2026-12-31', 5))).toBe(
      'Desde 1 dic 2026',
    );
  });
});

describe('formatWaiting', () => {
  it.each([
    [0, 'Hoy'],
    [1, '1 día'],
    [6, '6 días'],
  ])('%i días de espera → %s', (days, expected) => {
    expect(formatWaiting(days)).toBe(expected);
  });
});

describe('formatTravelers', () => {
  it.each([
    [1, 0, '1 adulto'],
    [2, 0, '2 adultos'],
    [2, 1, '2 adultos · 1 menor'],
    [1, 3, '1 adulto · 3 menores'],
  ])('%i adultos y %i menores → %s', (adults, minors, expected) => {
    expect(formatTravelers(adults, minors)).toBe(expected);
  });
});

describe('formatBudget', () => {
  // El formato de pesos lleva un espacio que no se parte entre el símbolo y el número.
  const pesos = (text: string) => text.replace(/ /g, ' ');

  it.each([
    [6_000_000, 8_000_000, '$ 6.000.000 – $ 8.000.000'],
    [5_000_000, null, 'Desde $ 5.000.000'],
    [null, 9_000_000, 'Hasta $ 9.000.000'],
    [null, null, 'Sin presupuesto'],
  ])('%s y %s → %s', (min, max, expected) => {
    expect(pesos(formatBudget(min, max))).toBe(expected);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ageOn,
  formatDateRange,
  formatDateTime,
  formatDay,
  formatLongDate,
  formatShortDate,
  formatShortDateTime,
  formatTimeAgo,
  todayInBogota,
} from './dates';

afterEach(() => {
  vi.useRealTimers();
});

describe('todayInBogota', () => {
  it('devuelve el día de Bogotá cuando en UTC ya es el día siguiente', () => {
    vi.useFakeTimers();
    // 03:30 UTC del 6 de octubre son las 22:30 del 5 de octubre en Bogotá.
    vi.setSystemTime(new Date('2026-10-06T03:30:00Z'));

    expect(todayInBogota()).toBe('2026-10-05');
  });
});

describe('ageOn', () => {
  it.each([
    ['2008-10-25', '2026-10-24', 17],
    ['2008-10-25', '2026-10-25', 18],
    ['2008-10-25', '2026-12-31', 18],
    ['2026-10-25', '2026-10-25', 0],
    // Quien nació un 29 de febrero cumple años el 1 de marzo en los años no bisiestos.
    ['2008-02-29', '2026-02-28', 17],
    ['2008-02-29', '2026-03-01', 18],
  ])('nacido el %s, el %s tiene %i años', (birthDate, day, age) => {
    expect(ageOn(birthDate, day)).toBe(age);
  });
});

describe('formatLongDate', () => {
  it('no corre una fecha sin hora a otro día', () => {
    expect(formatLongDate('2026-10-05')).toBe('5 de octubre de 2026');
  });
});

describe('formatShortDate', () => {
  it('da el día, el mes corto y el año sin correr la fecha', () => {
    expect(formatShortDate('2026-12-15')).toBe('15 dic 2026');
    expect(formatShortDate('2027-01-01')).toBe('1 ene 2027');
  });
});

describe('formatDay', () => {
  it('muestra el día de Bogotá de un momento exacto', () => {
    expect(formatDay('2026-11-02T15:00:00Z')).toBe('2 de noviembre de 2026');
    // 03:00 UTC del 3 de noviembre son las 22:00 del 2 en Bogotá.
    expect(formatDay('2026-11-03T03:00:00Z')).toBe('2 de noviembre de 2026');
  });
});

describe('formatShortDateTime', () => {
  it('muestra el momento abreviado con la hora de Bogotá', () => {
    // 02:15 UTC del 6 de octubre son las 21:15 del 5 de octubre en Bogotá.
    expect(formatShortDateTime('2026-10-06T02:15:00Z')).toBe(
      '5 oct 2026, 9:15 p.m.',
    );
  });
});

describe('formatDateTime', () => {
  it('muestra el momento con la hora de Bogotá', () => {
    expect(formatDateTime('2026-10-05T20:30:00Z')).toBe(
      '5 de octubre de 2026, 3:30 p.m.',
    );
  });
});

describe('formatDateRange', () => {
  it.each([
    ['mismo mes', '2026-12-18', '2026-12-24', '18–24 dic 2026'],
    ['distinto mes', '2026-11-28', '2026-12-03', '28 nov – 3 dic 2026'],
    ['distinto año', '2026-12-28', '2027-01-03', '28 dic 2026 – 3 ene 2027'],
    ['el mismo día', '2026-12-18', '2026-12-18', '18 dic 2026'],
  ])('%s', (_, start, end, expected) => {
    expect(formatDateRange(start, end)).toBe(expected);
  });
});

describe('formatTimeAgo', () => {
  it.each([
    ['2026-11-13T14:59:30Z', 'hace un momento'],
    ['2026-11-13T14:55:00Z', 'hace 5 minutos'],
    ['2026-11-13T13:00:00Z', 'hace 2 horas'],
    ['2026-11-11T15:00:00Z', 'hace 2 días'],
  ])('desde %s', (isoDateTime, expected) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-13T15:00:00Z'));

    expect(formatTimeAgo(isoDateTime)).toBe(expected);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ageOn,
  formatDateTime,
  formatLongDate,
  formatShortDateTime,
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

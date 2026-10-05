import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatDateTime, formatLongDate, todayInBogota } from './dates';

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

describe('formatLongDate', () => {
  it('no corre una fecha sin hora a otro día', () => {
    expect(formatLongDate('2026-10-05')).toBe('5 de octubre de 2026');
  });
});

describe('formatDateTime', () => {
  it('muestra el momento con la hora de Bogotá', () => {
    expect(formatDateTime('2026-10-05T20:30:00Z')).toBe(
      '5 de octubre de 2026, 3:30 p.m.',
    );
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { pastDateError } from './dates';

beforeEach(() => {
  vi.useFakeTimers();
  // 03:30 UTC del 27 de octubre son las 22:30 del 26 de octubre en Bogotá.
  vi.setSystemTime(new Date('2026-10-27T03:30:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('pastDateError', () => {
  it('acepta hoy en Bogotá y fechas anteriores', () => {
    expect(pastDateError('2026-10-26')).toBeUndefined();
    expect(pastDateError('1900-01-01')).toBeUndefined();
  });

  it('rechaza mañana en Bogotá aunque en UTC ya sea hoy', () => {
    expect(pastDateError('2026-10-27')).toBe('La fecha no puede ser futura.');
  });

  it('rechaza un año anterior a 1900', () => {
    expect(pastDateError('1899-12-31')).toBe('Revisa el año.');
  });

  it('vacía no es un error de esta regla', () => {
    expect(pastDateError('')).toBeUndefined();
  });
});

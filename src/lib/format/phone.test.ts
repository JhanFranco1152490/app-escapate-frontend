import { describe, expect, it } from 'vitest';

import { formatPhone, splitPhone, toE164 } from './phone';

describe('toE164', () => {
  it.each([
    ['300 111 2233', 'CO', '+573001112233'],
    ['+57 300 111 2233', 'CO', '+573001112233'],
    ['(300) 111-2233', 'CO', '+573001112233'],
    ['607 555 1234', 'CO', '+576075551234'],
    ['412 555 0101', 'VE', '+584125550101'],
    ['987 654 321', 'PE', '+51987654321'],
  ] as const)('%s con %s → %s', (number, country, expected) => {
    expect(toE164(number, country)).toBe(expected);
  });

  it.each([
    ['300 111 2233', 'PE'],
    ['100 111 2233', 'CO'],
    // Diez dígitos que empiezan por 3 pero no son un celular colombiano: la API los rechaza,
    // así que el navegador también.
    ['380 450 8172', 'CO'],
    ['300 111', 'CO'],
    ['', 'CO'],
    ['no es un número', 'CO'],
  ] as const)('%s con %s no es válido', (number, country) => {
    expect(toE164(number, country)).toBeNull();
  });
});

describe('splitPhone', () => {
  it('separa el país y el número nacional', () => {
    expect(splitPhone('+573001112233')).toEqual({
      country: 'CO',
      number: '3001112233',
    });
    expect(splitPhone('+584125550101')).toEqual({
      country: 'VE',
      number: '4125550101',
    });
  });

  it('reconoce el país dentro de un indicativo compartido', () => {
    // +1 809 es República Dominicana, no Estados Unidos.
    expect(splitPhone('+18095551234')).toEqual({
      country: 'DO',
      number: '8095551234',
    });
  });
});

describe('formatPhone', () => {
  it('muestra un número de Colombia en formato nacional, en grupos de 3, 3 y 4', () => {
    expect(formatPhone('+573001112233')).toBe('300 111 2233');
    expect(formatPhone('+576075551234')).toBe('607 555 1234');
  });

  it('muestra un número de otro país con su indicativo', () => {
    expect(formatPhone('+51987654321')).toBe('+51 987 654 321');
    expect(formatPhone('+584125550101')).toBe('+58 412 5550101');
  });

  it('devuelve tal cual un valor que no puede leer', () => {
    expect(formatPhone('3001112233')).toBe('3001112233');
  });
});

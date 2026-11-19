import { describe, expect, it } from 'vitest';

import {
  buildRequestMinor,
  buildRequestTraveler,
} from '@/test/travel-requests';

import { checkTravelerCounts } from './traveler-counts';

const adult = (id: number) => buildRequestTraveler({ id });
const minor = (id: number) => buildRequestMinor({ id });

describe('checkTravelerCounts', () => {
  it('sin viajeros asociados no compara nada', () => {
    expect(checkTravelerCounts({ adults: 2, minors: 1 }, [])).toEqual({
      kind: 'none',
    });
  });

  it('avisa que coinciden cuando las cantidades son las pedidas', () => {
    const check = checkTravelerCounts({ adults: 2, minors: 1 }, [
      adult(1),
      adult(2),
      minor(3),
    ]);
    expect(check).toEqual({
      kind: 'match',
      text: 'Coinciden con lo que pidió el cliente: 2 adultos · 1 menor.',
    });
  });

  it('dice que sobra un menor', () => {
    const check = checkTravelerCounts({ adults: 2, minors: 0 }, [
      adult(1),
      adult(2),
      minor(3),
    ]);
    expect(check).toEqual({
      kind: 'mismatch',
      text: 'Sobra 1 menor. La solicitud pide 2 adultos; hay 2 adultos · 1 menor.',
    });
  });

  it('dice cuántos adultos faltan, con el verbo en plural', () => {
    const check = checkTravelerCounts({ adults: 3, minors: 1 }, [
      adult(1),
      minor(2),
    ]);
    expect(check).toMatchObject({ kind: 'mismatch' });
    expect(check.kind === 'mismatch' && check.text).toMatch(
      /^Faltan 2 adultos\. /,
    );
  });

  it('une dos diferencias en una sola frase', () => {
    const check = checkTravelerCounts({ adults: 2, minors: 2 }, [
      adult(1),
      adult(2),
      adult(3),
      minor(4),
    ]);
    expect(check.kind === 'mismatch' && check.text).toMatch(
      /^Sobra 1 adulto y falta 1 menor\. /,
    );
  });

  it('cuenta como menor a quien la API marca como menor, sin mirar la edad', () => {
    const check = checkTravelerCounts({ adults: 1, minors: 0 }, [
      buildRequestTraveler({ id: 1, age: 17, is_minor: true }),
    ]);
    expect(check.kind === 'mismatch' && check.text).toMatch(
      /^Falta 1 adulto y sobra 1 menor\. /,
    );
  });
});

import { formatTravelers } from './format';
import type { RequestTraveler } from './request-travelers-api';

type Counts = { adults: number; minors: number };

export type TravelerCountsCheck =
  // Aún no hay a quién comparar.
  | { kind: 'none' }
  | { kind: 'match'; text: string }
  | { kind: 'mismatch'; text: string };

const countAssociated = (travelers: RequestTraveler[]): Counts => {
  const minors = travelers.filter((traveler) => traveler.is_minor).length;
  return { adults: travelers.length - minors, minors };
};

// "Falta 1 adulto", "Sobran 2 menores": el verbo concuerda con la cantidad.
function difference(
  wanted: number,
  has: number,
  one: string,
  many: string,
): string | null {
  const gap = wanted - has;
  if (gap === 0) return null;
  const count = Math.abs(gap);
  const verb =
    gap > 0
      ? count === 1
        ? 'falta'
        : 'faltan'
      : count === 1
        ? 'sobra'
        : 'sobran';
  return `${verb} ${count} ${count === 1 ? one : many}`;
}

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

// Compara lo que el cliente dijo al registrar (adultos y menores) con las personas asociadas.
// Es un aviso, no una regla: el cliente puede cambiar de idea y las cantidades se corrigen
// editando la solicitud.
export function checkTravelerCounts(
  requested: Counts,
  travelers: RequestTraveler[],
): TravelerCountsCheck {
  if (travelers.length === 0) return { kind: 'none' };

  const has = countAssociated(travelers);
  const differences = [
    difference(requested.adults, has.adults, 'adulto', 'adultos'),
    difference(requested.minors, has.minors, 'menor', 'menores'),
  ].filter((text) => text !== null);

  if (differences.length === 0) {
    return {
      kind: 'match',
      text: `Coinciden con lo que pidió el cliente: ${formatTravelers(requested.adults, requested.minors)}.`,
    };
  }
  return {
    kind: 'mismatch',
    text: `${capitalize(differences.join(' y '))}. La solicitud pide ${formatTravelers(requested.adults, requested.minors)}; hay ${formatTravelers(has.adults, has.minors)}.`,
  };
}

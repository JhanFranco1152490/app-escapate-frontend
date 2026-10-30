import { ageOn } from '@/lib/format/dates';

// La tarjeta de identidad es hasta los 18 años y el registro civil hasta los 7. Es solo un
// aviso: hay casos reales que no lo cumplen (una TI vigente unos días después de cumplir 18),
// así que el formulario no lo bloquea.
const LIMITS: Record<string, { age: number; expected: string }> = {
  TI: { age: 18, expected: 'CC' },
  RC: { age: 7, expected: 'TI' },
};

export function documentAgeWarning(
  documentType: string,
  birthDate: string,
  today: string,
) {
  const limit = LIMITS[documentType];
  if (!limit || !birthDate || birthDate > today) return undefined;
  if (ageOn(birthDate, today) < limit.age) return undefined;
  return `Revisa el tipo de documento: por la edad, normalmente correspondería ${limit.expected}.`;
}

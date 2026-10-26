// Puntos de miles sobre un número de solo dígitos: 1020304050 → 1.020.304.050.
const withThousands = (digits: string) =>
  digits.replace(/\B(?=([0-9]{3})+$)/g, '.');

// El documento llega normalizado de la API (sin puntos ni guiones). La cédula y el NIT se
// muestran como se escriben en Colombia; los demás pueden llevar letras y van tal cual. Sin
// documento devuelve null y la pantalla decide qué texto mostrar.
export function formatDocument(type: string | null, number: string | null) {
  if (!type || !number) return null;
  if (type === 'CC') return `CC ${withThousands(number)}`;
  if (type === 'NIT') {
    return `NIT ${withThousands(number.slice(0, -1))}-${number.slice(-1)}`;
  }
  return `${type} ${number}`;
}

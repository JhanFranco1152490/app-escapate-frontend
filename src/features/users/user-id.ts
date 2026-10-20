// El id viene de la URL. Uno imposible (texto, 0, decimal o más grande de lo que JavaScript
// representa sin perder precisión) no se manda a la API: la página dice directamente que no
// encontró al usuario.
export function parseUserId(value: string): number | null {
  if (!/^[1-9][0-9]*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

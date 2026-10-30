// Arma la consulta sin los parámetros vacíos: la API los trata como "sin filtro".
export function withQuery(
  path: string,
  params: Record<string, string | number | null>,
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== '') query.set(key, String(value));
  }
  return `${path}?${query}`;
}

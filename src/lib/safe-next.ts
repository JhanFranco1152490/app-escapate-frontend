const isControlChar = (char: string) => {
  const code = char.charCodeAt(0);
  return code < 0x20 || code === 0x7f;
};

// Ruta a la que volver después de una pantalla (entrar, registrar un cliente). Solo se acepta
// una ruta interna: si no empieza por una sola "/", el navegador podría tomarla como otro
// sitio ("//sitio", "/\sitio") y el enlace serviría para mandar a la persona a una página
// falsa. Los caracteres de control también se rechazan porque el navegador descarta algunos y
// "/\t/sitio" acaba en "//sitio". Lo que no se acepta se cambia por `fallback`.
export function safeNext(
  value: string | null | undefined,
  fallback = '/',
): string {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    [...value].some(isControlChar)
  ) {
    return fallback;
  }
  return value;
}

// Agrega (o reemplaza) un parámetro a una ruta interna conservando su consulta y su ancla:
// "/solicitudes/nueva" → "/solicitudes/nueva?client_id=21".
export function withSearchParam(path: string, name: string, value: string) {
  // La base solo sirve para que URL acepte una ruta relativa; no forma parte del resultado.
  const url = new URL(path, 'http://localhost');
  url.searchParams.set(name, value);
  return `${url.pathname}${url.search}${url.hash}`;
}

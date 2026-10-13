const isControlChar = (char: string) => {
  const code = char.charCodeAt(0);
  return code < 0x20 || code === 0x7f;
};

// Ruta a la que volver después de entrar. Solo se acepta una ruta interna: si no empieza por
// una sola "/", el navegador podría tomarla como otro sitio ("//sitio", "/\sitio") y el
// login serviría para mandar a la persona a una página falsa. Los caracteres de control
// también se rechazan porque el navegador descarta algunos y "/\t/sitio" acaba en "//sitio".
export function safeNext(value: string | null | undefined): string {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    [...value].some(isControlChar)
  ) {
    return '/';
  }
  return value;
}

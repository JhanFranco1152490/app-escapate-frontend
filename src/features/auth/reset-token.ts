'use client';

import { useEffect, useRef, useState } from 'react';

export function readTokenFromHash(hash: string) {
  return new URLSearchParams(hash.replace(/^#/, '')).get('token') || null;
}

// El token llega después de "#" para que el navegador nunca lo envíe a un servidor. Se lee
// una sola vez y se quita de la barra de direcciones, para que no quede en el historial ni a
// la vista. undefined mientras no se ha leído; null si el enlace no traía token.
export function useResetTokenFromHash() {
  const [token, setToken] = useState<string | null>();
  // En desarrollo React ejecuta el efecto dos veces; la segunda ya no encontraría el token.
  const alreadyRead = useRef(false);

  useEffect(() => {
    if (alreadyRead.current) return;
    alreadyRead.current = true;
    const { hash, pathname, search } = window.location;
    if (hash) window.history.replaceState(null, '', pathname + search);
    setToken(readTokenFromHash(hash));
  }, []);

  return token;
}

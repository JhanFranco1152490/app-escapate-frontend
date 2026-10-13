import { API_URL } from '@/lib/env';

import { safeNext } from './safe-next';

// Es una navegación de página completa, no un fetch: la API redirige a Google y, al volver,
// deja las cookies de sesión y redirige a next.
export function googleLoginUrl(next: string | null | undefined) {
  const params = new URLSearchParams({ next: safeNext(next) });
  return `${API_URL}/api/auth/google/start?${params}`;
}

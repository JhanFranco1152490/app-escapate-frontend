import type { SessionUser } from './api';
import { useCurrentUser } from './components/session-guard';

// Solo decide qué se muestra: la API responde 403 de todas formas si falta el permiso.
export function hasPermission(session: SessionUser | undefined, code: string) {
  return session?.permissions.includes(code) ?? false;
}

export function useHasPermission(code: string) {
  return hasPermission(useCurrentUser(), code);
}

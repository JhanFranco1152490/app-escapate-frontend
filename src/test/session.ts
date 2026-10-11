import type { components } from '@/lib/api/schema';

type SessionUser = components['schemas']['SessionUser'];

export function buildSession(
  overrides: Partial<SessionUser> = {},
): SessionUser {
  return {
    id: 1,
    email: 'persona.prueba@example.com',
    full_name: 'Persona de Prueba',
    role: { id: 1, name: 'Administrador' },
    permissions: [],
    ...overrides,
  };
}

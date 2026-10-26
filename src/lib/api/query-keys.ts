// Cada dominio agrega su bloque con la misma forma: all, lists, list(query), detail(id).
export const queryKeys = {
  session: () => ['session'] as const,
  profile: () => ['profile'] as const,
  resetToken: (token: string) => ['reset-token', token] as const,
  users: {
    all: () => ['users'] as const,
    lists: () => ['users', 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      ['users', 'list', filters] as const,
    detail: (id: number) => ['users', 'detail', id] as const,
    logins: (id: number, page: number) =>
      ['users', 'detail', id, 'logins', page] as const,
  },
  roles: {
    all: () => ['roles'] as const,
    lists: () => ['roles', 'list'] as const,
    detail: (id: number) => ['roles', 'detail', id] as const,
  },
  permissions: () => ['permissions'] as const,
  clients: {
    all: () => ['clients'] as const,
    lists: () => ['clients', 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      ['clients', 'list', filters] as const,
    detail: (id: number) => ['clients', 'detail', id] as const,
  },
  travelers: {
    all: () => ['travelers'] as const,
    lists: () => ['travelers', 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      ['travelers', 'list', filters] as const,
    detail: (id: number) => ['travelers', 'detail', id] as const,
  },
};

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
  suppliers: {
    all: () => ['suppliers'] as const,
    lists: () => ['suppliers', 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      ['suppliers', 'list', filters] as const,
    detail: (id: number) => ['suppliers', 'detail', id] as const,
  },
  // Los servicios se listan por proveedor, y las tarifas cuelgan de su servicio pero con su
  // propia raíz: guardar la ficha de un servicio no debe invalidar sus tarifas.
  touristServices: {
    all: () => ['tourist-services'] as const,
    lists: () => ['tourist-services', 'list'] as const,
    list: (supplierId: number, page: number) =>
      ['tourist-services', 'list', { supplierId, page }] as const,
    detail: (id: number) => ['tourist-services', 'detail', id] as const,
    rates: (serviceId: number) =>
      ['tourist-services', 'rates', serviceId] as const,
    ratesPage: (serviceId: number, page: number) =>
      ['tourist-services', 'rates', serviceId, page] as const,
  },
  // Los conteos por estado tienen su propia rama, para invalidarlos todos de una vez junto
  // con las listas.
  travelRequests: {
    all: () => ['travel-requests'] as const,
    lists: () => ['travel-requests', 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      ['travel-requests', 'list', filters] as const,
    summaries: () => ['travel-requests', 'summary'] as const,
    summary: (filters: Record<string, unknown>) =>
      ['travel-requests', 'summary', filters] as const,
    detail: (id: number) => ['travel-requests', 'detail', id] as const,
    advisors: () => ['travel-requests', 'advisors'] as const,
  },
  travelers: {
    all: () => ['travelers'] as const,
    lists: () => ['travelers', 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      ['travelers', 'list', filters] as const,
    detail: (id: number) => ['travelers', 'detail', id] as const,
  },
};

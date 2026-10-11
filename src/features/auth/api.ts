import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { components } from '@/lib/api/schema';

export type SessionUser = components['schemas']['SessionUser'];
export type LoginRequest = components['schemas']['LoginRequest'];
export type DocumentType = components['schemas']['DocumentType'];

const fetchSession = () => apiFetch<SessionUser>('/api/auth/me');

const login = (body: LoginRequest) =>
  apiFetch<SessionUser>('/api/auth/login', { method: 'POST', body });

const logout = () => apiFetch<void>('/api/auth/logout', { method: 'POST' });

export function useSession({ enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.session(),
    queryFn: fetchSession,
    enabled,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: (user) => queryClient.setQueryData(queryKeys.session(), user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    // Se borra toda la caché, no solo la sesión: en un equipo compartido, quien entre
    // después no debe ver datos que la persona anterior dejó cargados.
    onSuccess: () => queryClient.clear(),
  });
}

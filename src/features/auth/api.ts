import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { components } from '@/lib/api/schema';

export type SessionUser = components['schemas']['SessionUser'];
export type LoginRequest = components['schemas']['LoginRequest'];
export type DocumentType = components['schemas']['DocumentType'];
export type PasswordResetRequest =
  components['schemas']['PasswordResetRequest'];
export type PasswordResetAccepted =
  components['schemas']['PasswordResetAccepted'];
export type ResetTokenInfo = components['schemas']['ResetTokenInfo'];
export type TokenPurpose = components['schemas']['TokenPurpose'];
export type PasswordResetConfirm =
  components['schemas']['PasswordResetConfirm'];

const fetchSession = () => apiFetch<SessionUser>('/api/auth/me');

const login = (body: LoginRequest) =>
  apiFetch<SessionUser>('/api/auth/login', { method: 'POST', body });

const logout = () => apiFetch<void>('/api/auth/logout', { method: 'POST' });

const requestPasswordReset = (body: PasswordResetRequest) =>
  apiFetch<PasswordResetAccepted>('/api/auth/password-reset', {
    method: 'POST',
    body,
  });

// POST y no GET: el token va en el cuerpo para que no quede en la URL ni en los logs de
// servidores intermedios.
const checkResetToken = (token: string) =>
  apiFetch<ResetTokenInfo>('/api/auth/password-reset/check', {
    method: 'POST',
    body: { token },
  });

const confirmPasswordReset = (body: PasswordResetConfirm) =>
  apiFetch<SessionUser>('/api/auth/password-reset/confirm', {
    method: 'POST',
    body,
  });

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

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: requestPasswordReset });
}

export function useResetTokenCheck(token: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.resetToken(token ?? ''),
    queryFn: () => checkResetToken(token!),
    enabled: !!token,
    // Lo que dice un token no cambia mientras está vigente.
    staleTime: Infinity,
  });
}

export function useConfirmPasswordReset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: confirmPasswordReset,
    onSuccess: (user) => queryClient.setQueryData(queryKeys.session(), user),
  });
}

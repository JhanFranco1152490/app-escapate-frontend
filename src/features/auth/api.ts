import { useMutation } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/client';

import type { LoginValues } from './schemas';

const login = (body: LoginValues) =>
  apiFetch<unknown>('/api/auth/login', { method: 'POST', body });

export function useLogin() {
  return useMutation({ mutationFn: login });
}

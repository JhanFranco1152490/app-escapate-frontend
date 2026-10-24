import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { components } from '@/lib/api/schema';

export type RoleListItem = components['schemas']['RoleListItem'];
export type RoleDetail = components['schemas']['RoleDetail'];
export type RoleInput = components['schemas']['RoleInput'];
export type PermissionItem = components['schemas']['PermissionItem'];

const fetchRoles = () => apiFetch<RoleListItem[]>('/api/roles');

const fetchRole = (id: number) => apiFetch<RoleDetail>(`/api/roles/${id}`);

const fetchPermissions = () => apiFetch<PermissionItem[]>('/api/permissions');

const createRole = (body: RoleInput) =>
  apiFetch<RoleDetail>('/api/roles', { method: 'POST', body });

const updateRole = (id: number, body: RoleInput) =>
  apiFetch<RoleDetail>(`/api/roles/${id}`, { method: 'PUT', body });

const deleteRole = (id: number) =>
  apiFetch<void>(`/api/roles/${id}`, { method: 'DELETE' });

export function useRoles({ enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.roles.lists(),
    queryFn: fetchRoles,
    enabled,
    // Los roles cambian muy de vez en cuando, y cada cambio desde el panel invalida la lista.
    staleTime: 5 * 60 * 1000,
  });
}

export function useRole(id: number | null) {
  return useQuery({
    queryKey: queryKeys.roles.detail(id ?? 0),
    queryFn: () => fetchRole(id!),
    enabled: id !== null,
  });
}

export function usePermissionCatalog() {
  return useQuery({
    queryKey: queryKeys.permissions(),
    queryFn: fetchPermissions,
    // El catálogo sale del código del backend: solo cambia con un despliegue.
    staleTime: Infinity,
  });
}

// Deja el rol guardado en la caché y marca la lista como vieja (cambian nombres y conteos).
function useStoreRole() {
  const queryClient = useQueryClient();
  return (role: RoleDetail) => {
    queryClient.setQueryData(queryKeys.roles.detail(role.id), role);
    void queryClient.invalidateQueries({ queryKey: queryKeys.roles.lists() });
  };
}

export function useCreateRole() {
  const storeRole = useStoreRole();
  return useMutation({ mutationFn: createRole, onSuccess: storeRole });
}

export function useUpdateRole(id: number) {
  const queryClient = useQueryClient();
  const storeRole = useStoreRole();
  return useMutation({
    mutationFn: (body: RoleInput) => updateRole(id, body),
    onSuccess: (role) => {
      storeRole(role);
      // La lista y la ficha de usuarios muestran el nombre del rol.
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
    },
  });
}

export function useDeleteRole(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteRole(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.roles.detail(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.roles.lists() });
    },
  });
}

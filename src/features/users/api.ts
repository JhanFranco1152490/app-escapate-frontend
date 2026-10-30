import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import type { SessionUser } from '@/features/auth/api';
import { apiFetch } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { withQuery } from '@/lib/api/query-string';
import type { components } from '@/lib/api/schema';

export type UserListItem = components['schemas']['UserListItem'];
export type UserDetail = components['schemas']['UserDetail'];
export type UserSaved = components['schemas']['UserSaved'];
export type UserInput = components['schemas']['UserInput'];
export type UserCreate = components['schemas']['UserCreate'];
export type LoginEventItem = components['schemas']['LoginEventItem'];
export type LoginMethod = components['schemas']['LoginMethod'];
export type UserPage = components['schemas']['Page_UserListItem_'];
export type LoginPage = components['schemas']['Page_LoginEventItem_'];

export type UserStatusFilter = 'active' | 'inactive';
export type UserListFilters = {
  q: string;
  status: UserStatusFilter | null;
  roleId: number | null;
  page: number;
};

export const USERS_PAGE_SIZE = 20;
export const LOGINS_PAGE_SIZE = 10;

const fetchUsers = (filters: UserListFilters) =>
  apiFetch<UserPage>(
    withQuery('/api/users', {
      q: filters.q,
      status: filters.status,
      role_id: filters.roleId,
      page: filters.page,
      page_size: USERS_PAGE_SIZE,
    }),
  );

const fetchUser = (id: number) => apiFetch<UserDetail>(`/api/users/${id}`);

const fetchUserLogins = (id: number, page: number) =>
  apiFetch<LoginPage>(
    withQuery(`/api/users/${id}/logins`, { page, page_size: LOGINS_PAGE_SIZE }),
  );

const createUser = (body: UserCreate) =>
  apiFetch<UserSaved>('/api/users', { method: 'POST', body });

const updateUser = (id: number, body: UserInput) =>
  apiFetch<UserSaved>(`/api/users/${id}`, { method: 'PUT', body });

const userAction = (id: number, action: 'deactivate' | 'activate') =>
  apiFetch<UserDetail>(`/api/users/${id}/${action}`, { method: 'POST' });

const resendInvitation = (id: number) =>
  apiFetch<void>(`/api/users/${id}/invitation`, { method: 'POST' });

const changeUserRole = (id: number, roleId: number) =>
  apiFetch<UserDetail>(`/api/users/${id}/role`, {
    method: 'PUT',
    body: { role_id: roleId },
  });

const unlinkGoogle = (id: number) =>
  apiFetch<UserDetail>(`/api/users/${id}/google`, { method: 'DELETE' });

export function useUsers(filters: UserListFilters) {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => fetchUsers(filters),
    // Al cambiar de página o de filtro, la tabla anterior sigue a la vista hasta que llega
    // la nueva, en vez de parpadear con el esqueleto.
    placeholderData: keepPreviousData,
  });
}

export function useUser(id: number | null) {
  return useQuery({
    queryKey: queryKeys.users.detail(id ?? 0),
    queryFn: () => fetchUser(id!),
    enabled: id !== null,
  });
}

export function useUserLogins(id: number, page: number) {
  return useQuery({
    queryKey: queryKeys.users.logins(id, page),
    queryFn: () => fetchUserLogins(id, page),
    placeholderData: keepPreviousData,
  });
}

// Lo que hace cada mutación que devuelve el usuario: deja la ficha nueva en la caché, marca
// las listas como viejas y, si es el usuario de la sesión, también la sesión (su nombre se ve
// en la barra del panel). La sesión se lee de la caché sin pedirla: dentro del panel solo la
// guardia la consulta.
function useStoreUser() {
  const queryClient = useQueryClient();
  return (user: UserDetail) => {
    queryClient.setQueryData(queryKeys.users.detail(user.id), user);
    void queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    const session = queryClient.getQueryData<SessionUser>(queryKeys.session());
    if (session?.id === user.id)
      void queryClient.invalidateQueries({ queryKey: queryKeys.session() });
  };
}

export function useCreateUser() {
  const storeUser = useStoreUser();
  return useMutation({
    mutationFn: createUser,
    onSuccess: ({ user }) => storeUser(user),
  });
}

export function useUpdateUser(id: number) {
  const storeUser = useStoreUser();
  return useMutation({
    mutationFn: (body: UserInput) => updateUser(id, body),
    onSuccess: ({ user }) => storeUser(user),
  });
}

export function useDeactivateUser(id: number) {
  const storeUser = useStoreUser();
  return useMutation({
    mutationFn: () => userAction(id, 'deactivate'),
    onSuccess: storeUser,
  });
}

export function useActivateUser(id: number) {
  const storeUser = useStoreUser();
  return useMutation({
    mutationFn: () => userAction(id, 'activate'),
    onSuccess: storeUser,
  });
}

export function useUnlinkGoogle(id: number) {
  const storeUser = useStoreUser();
  return useMutation({
    mutationFn: () => unlinkGoogle(id),
    onSuccess: storeUser,
  });
}

export function useChangeUserRole(id: number) {
  const queryClient = useQueryClient();
  const storeUser = useStoreUser();
  return useMutation({
    mutationFn: (roleId: number) => changeUserRole(id, roleId),
    onSuccess: (user) => {
      storeUser(user);
      // Cambian los conteos de personas de cada rol.
      void queryClient.invalidateQueries({ queryKey: queryKeys.roles.lists() });
    },
  });
}

export function useResendInvitation(id: number) {
  return useMutation({ mutationFn: () => resendInvitation(id) });
}

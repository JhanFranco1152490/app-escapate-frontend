import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { withQuery } from '@/lib/api/query-string';
import type { components } from '@/lib/api/schema';

import type {
  QuoteDetail,
  QuoteItem,
  QuoteItemCreate,
  QuoteItemUpdate,
} from './api';

type Schemas = components['schemas'];
export type PackageListItem = Schemas['PackageListItem'];
export type PackageDetail = Schemas['PackageDetail'];
export type PackageCreate = Schemas['PackageCreate'];
export type PackageUpdate = Schemas['PackageUpdate'];
type PackagePage = Schemas['Page_PackageListItem_'];

export function usePackages(filters: {
  q: string;
  active: boolean | null;
  page: number;
}) {
  return useQuery({
    queryKey: queryKeys.packages.list(filters),
    queryFn: () =>
      apiFetch<PackagePage>(
        withQuery('/api/packages', {
          q: filters.q,
          active: filters.active === null ? null : String(filters.active),
          page: filters.page,
          page_size: 50,
        }),
      ),
    placeholderData: keepPreviousData,
  });
}

export function usePackage(id: number | null) {
  return useQuery({
    queryKey: queryKeys.packages.detail(id ?? 0),
    queryFn: () => apiFetch<PackageDetail>(`/api/packages/${id}`),
    enabled: id !== null,
  });
}

function useStorePackage() {
  const queryClient = useQueryClient();
  return (data: PackageDetail) => {
    queryClient.setQueryData(queryKeys.packages.detail(data.id), data);
    void queryClient.invalidateQueries({
      queryKey: queryKeys.packages.lists(),
    });
  };
}

export function useCreatePackage() {
  const store = useStorePackage();
  return useMutation({
    mutationFn: (body: PackageCreate) =>
      apiFetch<PackageDetail>('/api/packages', { method: 'POST', body }),
    onSuccess: store,
  });
}

export function useUpdatePackage(id: number) {
  const store = useStorePackage();
  return useMutation({
    mutationFn: (body: PackageUpdate) =>
      apiFetch<PackageDetail>(`/api/packages/${id}`, { method: 'PUT', body }),
    onSuccess: store,
  });
}

// Los servicios cuelgan del paquete: después de cada cambio se vuelve a pedir entero.
function useRefreshPackage(id: number) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.packages.detail(id) });
}

export function useAddPackageItem(packageId: number) {
  const refresh = useRefreshPackage(packageId);
  return useMutation({
    mutationFn: (body: QuoteItemCreate) =>
      apiFetch<QuoteItem>(`/api/packages/${packageId}/items`, {
        method: 'POST',
        body,
      }),
    onSuccess: refresh,
  });
}

export function useUpdatePackageItem(packageId: number) {
  const refresh = useRefreshPackage(packageId);
  return useMutation({
    mutationFn: ({ itemId, body }: { itemId: number; body: QuoteItemUpdate }) =>
      apiFetch<QuoteItem>(`/api/packages/${packageId}/items/${itemId}`, {
        method: 'PUT',
        body,
      }),
    onSuccess: refresh,
  });
}

export function useRemovePackageItem(packageId: number) {
  const refresh = useRefreshPackage(packageId);
  return useMutation({
    mutationFn: (itemId: number) =>
      apiFetch<void>(`/api/packages/${packageId}/items/${itemId}`, {
        method: 'DELETE',
      }),
    onSuccess: refresh,
  });
}

export function useQuoteFromPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { travel_request_id: number; package_id: number }) =>
      apiFetch<QuoteDetail>('/api/quotes/from-package', {
        method: 'POST',
        body,
      }),
    onSuccess: (quote) => {
      queryClient.setQueryData(queryKeys.quotes.detail(quote.id), quote);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.quotes.lists(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.travelRequests.all(),
      });
    },
  });
}

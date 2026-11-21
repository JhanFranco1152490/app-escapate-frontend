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

type Schemas = components['schemas'];
export type SaleListItem = Schemas['SaleListItem'];
export type SaleDetail = Schemas['SaleDetail'];
export type SalePage = Schemas['Page_SaleListItem_'];
export type SaleCreate = Schemas['SaleCreate'];
export type PaymentCreate = Schemas['PaymentCreate'];
export type PaymentStatus = Schemas['PaymentStatus'];
export type PaymentMethod = Schemas['PaymentMethod'];

export type SaleFilters = {
  q: string;
  paymentStatus: PaymentStatus | null;
  quoteId: number | null;
  page: number;
};

export const SALES_PAGE_SIZE = 20;

const fetchSales = (filters: SaleFilters) =>
  apiFetch<SalePage>(
    withQuery('/api/sales', {
      q: filters.q,
      payment_status: filters.paymentStatus,
      quote_id: filters.quoteId,
      page: filters.page,
      page_size: SALES_PAGE_SIZE,
    }),
  );

export function useSales(filters: SaleFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.sales.list(filters),
    queryFn: () => fetchSales(filters),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useSale(id: number | null) {
  return useQuery({
    queryKey: queryKeys.sales.detail(id ?? 0),
    queryFn: () => apiFetch<SaleDetail>(`/api/sales/${id}`),
    enabled: id !== null,
  });
}

function useStoreSale() {
  const queryClient = useQueryClient();
  return (sale: SaleDetail) => {
    queryClient.setQueryData(queryKeys.sales.detail(sale.id), sale);
    void queryClient.invalidateQueries({ queryKey: queryKeys.sales.lists() });
  };
}

export function useCreateSale() {
  const store = useStoreSale();
  return useMutation({
    mutationFn: (body: SaleCreate) =>
      apiFetch<SaleDetail>('/api/sales', { method: 'POST', body }),
    onSuccess: store,
  });
}

export function useAddPayment(saleId: number) {
  const store = useStoreSale();
  return useMutation({
    mutationFn: (body: PaymentCreate) =>
      apiFetch<SaleDetail>(`/api/sales/${saleId}/payments`, {
        method: 'POST',
        body,
      }),
    onSuccess: store,
  });
}

export function useRemovePayment(saleId: number) {
  const store = useStoreSale();
  return useMutation({
    mutationFn: (paymentId: number) =>
      apiFetch<SaleDetail>(`/api/sales/${saleId}/payments/${paymentId}`, {
        method: 'DELETE',
      }),
    onSuccess: store,
  });
}

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
export type Profitability = Schemas['Profitability'];
export type ActualCost = Schemas['ActualCostOut'];
export type ActualCostInput = Schemas['ActualCostInput'];
export type FinanceSummary = Schemas['FinanceSummary'];
export type Expense = Schemas['ExpenseOut'];
export type ExpenseInput = Schemas['ExpenseInput'];
export type ExpenseCategory = Schemas['ExpenseCategory'];
export type ExpensePage = Schemas['Page_ExpenseOut_'];

export type Period = { from: string; to: string };

export function useProfitability(saleId: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.finance.profitability(saleId),
    queryFn: () =>
      apiFetch<Profitability>(`/api/sales/${saleId}/profitability`),
    enabled,
  });
}

export function useFinanceSummary(period: Period) {
  return useQuery({
    queryKey: queryKeys.finance.summary(period),
    queryFn: () =>
      apiFetch<FinanceSummary>(
        withQuery('/api/finance/summary', {
          date_from: period.from,
          date_to: period.to,
        }),
      ),
    placeholderData: keepPreviousData,
  });
}

export function useExpenses(period: Period) {
  return useQuery({
    queryKey: queryKeys.finance.expenses(period),
    queryFn: () =>
      apiFetch<ExpensePage>(
        withQuery('/api/expenses', {
          date_from: period.from,
          date_to: period.to,
          page_size: 100,
        }),
      ),
    placeholderData: keepPreviousData,
  });
}

// Todo lo financiero cuelga de una raíz: un costo o un gasto cambia la rentabilidad y los
// totales a la vez.
function useStoreProfitability(saleId: number) {
  const queryClient = useQueryClient();
  return (result: Profitability) => {
    queryClient.setQueryData(queryKeys.finance.profitability(saleId), result);
    void queryClient.invalidateQueries({ queryKey: queryKeys.finance.all() });
  };
}

export function useAddCost(saleId: number) {
  const store = useStoreProfitability(saleId);
  return useMutation({
    mutationFn: (body: ActualCostInput) =>
      apiFetch<Profitability>(`/api/sales/${saleId}/costs`, {
        method: 'POST',
        body,
      }),
    onSuccess: store,
  });
}

export function useUpdateCost(saleId: number) {
  const store = useStoreProfitability(saleId);
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: ActualCostInput }) =>
      apiFetch<Profitability>(`/api/costs/${id}`, { method: 'PUT', body }),
    onSuccess: store,
  });
}

export function useRemoveCost(saleId: number) {
  const store = useStoreProfitability(saleId);
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<Profitability>(`/api/costs/${id}`, { method: 'DELETE' }),
    onSuccess: store,
  });
}

function useRefreshFinance() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.finance.all() });
}

export function useAddExpense() {
  const refresh = useRefreshFinance();
  return useMutation({
    mutationFn: (body: ExpenseInput) =>
      apiFetch<Expense>('/api/expenses', { method: 'POST', body }),
    onSuccess: refresh,
  });
}

export function useRemoveExpense() {
  const refresh = useRefreshFinance();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/api/expenses/${id}`, { method: 'DELETE' }),
    onSuccess: refresh,
  });
}

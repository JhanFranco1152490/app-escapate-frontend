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
export type FollowUp = Schemas['FollowUpOut'];
export type FollowUpPage = Schemas['Page_FollowUpOut_'];
export type FollowUpCreate = Schemas['FollowUpCreate'];
export type FollowUpComplete = Schemas['FollowUpComplete'];
export type FollowUpChannel = Schemas['FollowUpChannel'];
export type AlertColor = Schemas['AlertColor'];
export type AlertSummary = Schemas['AlertSummary'];

export type FollowUpFilters = {
  status: 'pending' | 'done' | null;
  alert: AlertColor | null;
  quoteId: number | null;
  page: number;
};

export const FOLLOW_UPS_PAGE_SIZE = 20;

const fetchFollowUps = (filters: FollowUpFilters) =>
  apiFetch<FollowUpPage>(
    withQuery('/api/follow-ups', {
      status: filters.status,
      alert: filters.alert,
      quote_id: filters.quoteId,
      page: filters.page,
      page_size: FOLLOW_UPS_PAGE_SIZE,
    }),
  );

export function useFollowUps(filters: FollowUpFilters) {
  return useQuery({
    queryKey: queryKeys.followUps.list(filters),
    queryFn: () => fetchFollowUps(filters),
    placeholderData: keepPreviousData,
  });
}

export function useAlertSummary(enabled = true) {
  return useQuery({
    queryKey: queryKeys.followUps.alerts(),
    queryFn: () => apiFetch<AlertSummary>('/api/follow-ups/alerts'),
    enabled,
  });
}

function useRefreshFollowUps() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.followUps.all() });
}

export function useScheduleFollowUp(quoteId: number) {
  const refresh = useRefreshFollowUps();
  return useMutation({
    mutationFn: (body: FollowUpCreate) =>
      apiFetch<FollowUp>(`/api/quotes/${quoteId}/follow-ups`, {
        method: 'POST',
        body,
      }),
    onSuccess: refresh,
  });
}

export function useCompleteFollowUp() {
  const refresh = useRefreshFollowUps();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: FollowUpComplete }) =>
      apiFetch<FollowUp>(`/api/follow-ups/${id}/complete`, {
        method: 'POST',
        body,
      }),
    onSuccess: refresh,
  });
}

export function useRemoveFollowUp() {
  const refresh = useRefreshFollowUps();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/api/follow-ups/${id}`, { method: 'DELETE' }),
    onSuccess: refresh,
  });
}

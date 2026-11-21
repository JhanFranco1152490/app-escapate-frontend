import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { withQuery } from '@/lib/api/query-string';
import type { components } from '@/lib/api/schema';

type Schemas = components['schemas'];
export type Dashboard = Schemas['Dashboard'];
export type CommercialIndicators = Schemas['CommercialIndicators'];
export type FinancialIndicators = Schemas['FinancialIndicators'];
export type RankRow = Schemas['RankRow'];
export type Report = Schemas['Report'];
export type ReportKind = Schemas['ReportKind'];

export type Period = { from: string; to: string };

const periodQuery = (period: Period) => ({
  date_from: period.from,
  date_to: period.to,
});

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.reports.dashboard(),
    queryFn: () => apiFetch<Dashboard>('/api/reports/dashboard'),
  });
}

export function useCommercialIndicators(period: Period) {
  return useQuery({
    queryKey: queryKeys.reports.commercial(period),
    queryFn: () =>
      apiFetch<CommercialIndicators>(
        withQuery('/api/reports/commercial', periodQuery(period)),
      ),
    placeholderData: keepPreviousData,
  });
}

export function useFinancialIndicators(period: Period, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.reports.financial(period),
    queryFn: () =>
      apiFetch<FinancialIndicators>(
        withQuery('/api/reports/financial', periodQuery(period)),
      ),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useReport(kind: ReportKind, period: Period) {
  return useQuery({
    queryKey: queryKeys.reports.report(kind, period),
    queryFn: () =>
      apiFetch<Report>(withQuery(`/api/reports/${kind}`, periodQuery(period))),
    placeholderData: keepPreviousData,
  });
}

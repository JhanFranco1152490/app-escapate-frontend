import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { withQuery } from '@/lib/api/query-string';
import type { components } from '@/lib/api/schema';

type Schemas = components['schemas'];
export type QuoteListItem = Schemas['QuoteListItem'];
export type QuoteDetail = Schemas['QuoteDetail'];
export type QuotePage = Schemas['Page_QuoteListItem_'];
export type QuoteStatus = Schemas['QuoteStatus'];
export type QuoteStatusFilter = Schemas['QuoteStatusFilter'];
export type QuoteGeneralUpdate = Schemas['QuoteGeneralUpdate'];
export type QuoteConditionsUpdate = Schemas['QuoteConditionsUpdate'];
export type QuotePricingUpdate = Schemas['QuotePricingUpdate'];
export type QuoteItem = Schemas['QuoteItemOut'];
export type QuoteItemCreate = Schemas['QuoteItemCreate'];
export type QuoteItemUpdate = Schemas['QuoteItemUpdate'];
export type ServiceType = Schemas['SupplierCategory'];
export type ChargeUnit = Schemas['ChargeUnit'];
export type OfferService = Schemas['OfferService'];
export type OfferRate = Schemas['OfferRate'];
export type OfferPage = Schemas['Page_OfferService_'];

export type QuoteFilters = {
  q: string;
  status: QuoteStatusFilter | null;
  clientId: number | null;
  travelRequestId: number | null;
  page: number;
};

export const QUOTES_PAGE_SIZE = 20;

const fetchQuotes = (filters: QuoteFilters) =>
  apiFetch<QuotePage>(
    withQuery('/api/quotes', {
      q: filters.q,
      status: filters.status,
      client_id: filters.clientId,
      travel_request_id: filters.travelRequestId,
      page: filters.page,
      page_size: QUOTES_PAGE_SIZE,
    }),
  );

const fetchQuote = (id: number) => apiFetch<QuoteDetail>(`/api/quotes/${id}`);

export function useQuotes(filters: QuoteFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.quotes.list(filters),
    queryFn: () => fetchQuotes(filters),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useQuote(id: number | null) {
  return useQuery({
    queryKey: queryKeys.quotes.detail(id ?? 0),
    queryFn: () => fetchQuote(id!),
    enabled: id !== null,
  });
}

export function useOffer(
  filters: { q: string; serviceType: ServiceType | null; page: number },
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.quotes.offer(filters),
    queryFn: () =>
      apiFetch<OfferPage>(
        withQuery('/api/quotes/offer', {
          q: filters.q,
          service_type: filters.serviceType,
          page: filters.page,
          page_size: 20,
        }),
      ),
    placeholderData: keepPreviousData,
    enabled,
  });
}

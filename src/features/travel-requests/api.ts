import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { withQuery } from '@/lib/api/query-string';
import type { components } from '@/lib/api/schema';

type Schemas = components['schemas'];
export type TravelRequestListItem = Schemas['TravelRequestListItem'];
export type TravelRequestDetail = Schemas['TravelRequestDetail'];
export type TravelRequestCreate = Schemas['TravelRequestCreate'];
export type TravelRequestUpdate = Schemas['TravelRequestUpdate'];
export type TravelRequestClose = Schemas['TravelRequestClose'];
export type TravelRequestReopen = Schemas['TravelRequestReopen'];
export type TravelRequestSummary = Schemas['TravelRequestSummary'];
export type TravelRequestPage = Schemas['Page_TravelRequestListItem_'];
export type TravelRequestStatus = Schemas['TravelRequestStatus'];
export type StatusFilter = Schemas['StatusFilter'];
export type RequestSort = Schemas['RequestSort'];
export type DateMode = Schemas['DateMode'];
export type TravelType = Schemas['TravelType'];
export type AccommodationCategory = Schemas['AccommodationCategory'];
export type CloseReason = Schemas['CloseReason'];
export type AdvisorOption = Schemas['AdvisorOption'];

export type TravelRequestFilters = {
  q: string;
  status: StatusFilter | null;
  assignedTo: number | null;
  clientId: number | null;
  sort: RequestSort;
  page: number;
};

// Los conteos respetan el asesor y el cliente, pero no la búsqueda ni el estado.
export type SummaryFilters = Pick<
  TravelRequestFilters,
  'assignedTo' | 'clientId'
>;

export const TRAVEL_REQUESTS_PAGE_SIZE = 20;

const fetchTravelRequests = (filters: TravelRequestFilters) =>
  apiFetch<TravelRequestPage>(
    withQuery('/api/travel-requests', {
      q: filters.q,
      status: filters.status,
      assigned_to: filters.assignedTo,
      client_id: filters.clientId,
      sort: filters.sort,
      page: filters.page,
      page_size: TRAVEL_REQUESTS_PAGE_SIZE,
    }),
  );

const fetchSummary = (filters: SummaryFilters) =>
  apiFetch<TravelRequestSummary>(
    withQuery('/api/travel-requests/summary', {
      assigned_to: filters.assignedTo,
      client_id: filters.clientId,
    }),
  );

const fetchAdvisors = () =>
  apiFetch<AdvisorOption[]>('/api/travel-requests/advisors');

const fetchTravelRequest = (id: number) =>
  apiFetch<TravelRequestDetail>(`/api/travel-requests/${id}`);

export function useTravelRequests(filters: TravelRequestFilters) {
  return useQuery({
    queryKey: queryKeys.travelRequests.list(filters),
    queryFn: () => fetchTravelRequests(filters),
    // Al cambiar de página o de filtro, la tabla anterior sigue a la vista hasta que llega
    // la nueva, en vez de parpadear con el esqueleto.
    placeholderData: keepPreviousData,
  });
}

export function useTravelRequestSummary(filters: SummaryFilters) {
  return useQuery({
    queryKey: queryKeys.travelRequests.summary(filters),
    queryFn: () => fetchSummary(filters),
    placeholderData: keepPreviousData,
  });
}

export function useAdvisors() {
  return useQuery({
    queryKey: queryKeys.travelRequests.advisors(),
    queryFn: fetchAdvisors,
  });
}

export function useTravelRequest(id: number | null) {
  return useQuery({
    queryKey: queryKeys.travelRequests.detail(id ?? 0),
    queryFn: () => fetchTravelRequest(id!),
    enabled: id !== null,
  });
}

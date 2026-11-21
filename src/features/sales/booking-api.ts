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
export type Booking = Schemas['BookingOut'];
export type BookingPage = Schemas['Page_BookingOut_'];
export type BookingStatus = Schemas['BookingStatus'];
export type BookingUpdate = Schemas['BookingUpdate'];

export type BookingFilters = {
  status: BookingStatus | null;
  saleId: number | null;
  page: number;
};

export const BOOKINGS_PAGE_SIZE = 50;

export function useBookings(filters: BookingFilters) {
  return useQuery({
    queryKey: queryKeys.bookings.list(filters),
    queryFn: () =>
      apiFetch<BookingPage>(
        withQuery('/api/bookings', {
          status: filters.status,
          sale_id: filters.saleId,
          page: filters.page,
          page_size: BOOKINGS_PAGE_SIZE,
        }),
      ),
    placeholderData: keepPreviousData,
  });
}

function useRefreshBookings() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
}

export function usePrepareBookings(saleId: number) {
  const refresh = useRefreshBookings();
  return useMutation({
    mutationFn: () =>
      apiFetch<Booking[]>(`/api/sales/${saleId}/bookings/prepare`, {
        method: 'POST',
      }),
    onSuccess: refresh,
  });
}

export function useUpdateBooking() {
  const refresh = useRefreshBookings();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: BookingUpdate }) =>
      apiFetch<Booking>(`/api/bookings/${id}`, { method: 'PUT', body }),
    onSuccess: refresh,
  });
}

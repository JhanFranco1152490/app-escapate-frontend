import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { isApiError, isUnauthorized } from '@/lib/api/errors';
import { queryKeys } from '@/lib/api/query-keys';

export function createQueryClient() {
  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => onUnauthorized(error, query.queryKey),
    }),
    mutationCache: new MutationCache({
      onError: (error) => onUnauthorized(error),
    }),
    defaultOptions: {
      queries: {
        // Un 4xx no cambia por reintentar; un 5xx o un fallo de red, a veces sí.
        retry: (failureCount, error) =>
          !(isApiError(error) && error.status < 500) && failureCount < 1,
        refetchOnWindowFocus: false,
      },
    },
  });

  // Un 401 en cualquier consulta o mutación significa que la sesión ya no vale: se invalida
  // desde aquí para que la guardia de las rutas protegidas la vuelva a comprobar y redirija.
  function onUnauthorized(error: unknown, queryKey?: readonly unknown[]) {
    if (!isUnauthorized(error)) return;
    const sessionKey = queryKeys.session();
    // La consulta de la sesión no se invalida a sí misma: la guardia la volvería a pedir en
    // un ciclo sin fin mientras redirige.
    if (queryKey?.[0] === sessionKey[0]) return;
    void queryClient.invalidateQueries({ queryKey: sessionKey });
  }

  return queryClient;
}

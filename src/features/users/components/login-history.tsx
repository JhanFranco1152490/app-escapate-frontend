'use client';

import { parseAsInteger, useQueryState } from 'nuqs';
import { useEffect } from 'react';

import { Pagination } from '@/components/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { isApiError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/format/dates';

import { LOGINS_PAGE_SIZE, useUserLogins, type LoginMethod } from '../api';

const METHOD_LABELS: Record<LoginMethod, string> = {
  document: 'Documento y contraseña',
  google: 'Google',
  email_link: 'Enlace del correo',
};

export function LoginHistory({ userId }: { userId: number }) {
  const [pageParam, setPageParam] = useQueryState(
    'logins_page',
    parseAsInteger.withDefault(1).withOptions({ history: 'replace' }),
  );
  const page = Math.max(pageParam, 1);
  const logins = useUserLogins(userId, page);
  const outOfRange =
    isApiError(logins.error) && logins.error.status === 404 && page > 1;

  // Una página que ya no existe (el historial solo guarda 90 días) vuelve a la primera.
  useEffect(() => {
    if (outOfRange) void setPageParam(null);
  }, [outOfRange, setPageParam]);

  return (
    <section
      aria-labelledby="login-history-title"
      className="rounded-md border bg-card"
    >
      <div className="flex flex-col gap-1.5 border-b px-5 py-4">
        <h2
          id="login-history-title"
          className="font-heading text-lg font-semibold"
        >
          Historial de ingresos
        </h2>
        <p className="max-w-2xl text-[0.78125rem] leading-relaxed text-muted-foreground">
          Cada vez que la persona abre una sesión nueva (otro dispositivo, o
          después de cerrar sesión). Mientras usa el panel a diario, la sesión
          se renueva sola y no aparecen ingresos nuevos: para eso está
          &quot;Última actividad&quot;. Se guardan los últimos 90 días.
        </p>
      </div>
      {logins.data ? (
        logins.data.results.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            Todavía no ha iniciado sesión
          </p>
        ) : (
          <>
            <ul aria-busy={logins.isFetching}>
              {logins.data.results.map((login, index) => (
                <li
                  // La API no da un id por ingreso, y dos pueden coincidir en fecha y método.
                  key={`${login.created_at}-${login.method}-${index}`}
                  className="flex flex-col gap-0.5 border-t px-5 py-3 first:border-t-0 sm:flex-row sm:justify-between"
                >
                  <span className="text-sm">
                    {formatDateTime(login.created_at)}
                  </span>
                  <span className="font-mono text-[0.6875rem] text-muted-foreground">
                    {METHOD_LABELS[login.method]}
                  </span>
                </li>
              ))}
            </ul>
            <Pagination
              page={page}
              pageSize={LOGINS_PAGE_SIZE}
              count={logins.data.count}
              hasPrevious={logins.data.previous !== null}
              hasNext={logins.data.next !== null}
              onPageChange={(next) => void setPageParam(next > 1 ? next : null)}
            />
          </>
        )
      ) : logins.isError && !outOfRange ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">
          No pudimos cargar el historial.{' '}
          <button
            type="button"
            className="underline underline-offset-4"
            onClick={() => void logins.refetch()}
          >
            Reintentar
          </button>
        </p>
      ) : (
        <div
          role="status"
          aria-label="Cargando el historial"
          className="flex flex-col gap-3 px-5 py-5"
        >
          <Skeleton className="h-3.5 w-64 max-w-full" />
          <Skeleton className="h-3.5 w-56 max-w-full" />
        </div>
      )}
    </section>
  );
}

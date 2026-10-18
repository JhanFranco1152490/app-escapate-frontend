'use client';

import { ArrowLeft, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ErrorState } from '@/components/error-state';
import { ForbiddenState } from '@/components/forbidden-state';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { isApiError } from '@/lib/api/errors';

import { useUser } from '../api';
import { clearSavedNotice, readSavedNotice } from '../saved-notice';
import { parseUserId } from '../user-id';
import { LoginHistory } from './login-history';
import { UserDetail } from './user-detail';
import { UserNotFound } from './user-not-found';
import { UserSavedNotice } from './user-saved-notice';

export function UserDetailScreen({ id }: { id: string }) {
  const userId = parseUserId(id);
  const user = useUser(userId);
  // Lo que dejó el formulario al guardar: se lee al montar y se borra enseguida, así no
  // reaparece al volver a abrir la ficha.
  const [notice] = useState(() =>
    userId === null ? undefined : readSavedNotice(userId),
  );
  useEffect(clearSavedNotice, []);

  const errorStatus = isApiError(user.error) ? user.error.status : undefined;
  if (userId === null || errorStatus === 404) return <UserNotFound />;
  if (errorStatus === 403) return <ForbiddenState />;

  return (
    <div className="flex max-w-5xl flex-col gap-7">
      <Link
        href="/usuarios"
        className="flex min-h-11 w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Usuarios
      </Link>
      {user.data ? (
        <>
          <PageHeader
            eyebrow="Administración / 02"
            title={user.data.full_name}
          />
          {notice && <UserSavedNotice notice={notice} />}
          <UserDetail user={user.data} />
          <LoginHistory userId={user.data.id} />
        </>
      ) : user.isError ? (
        <ErrorState
          title="No pudimos cargar el usuario"
          action={
            <Button onClick={() => void user.refetch()}>
              <RotateCcw aria-hidden="true" />
              Reintentar
            </Button>
          }
        >
          Se interrumpió la conexión con el servidor. Inténtalo de nuevo en un
          momento.
        </ErrorState>
      ) : (
        <div
          role="status"
          aria-label="Cargando el usuario"
          className="flex flex-col gap-4"
        >
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}
    </div>
  );
}

'use client';

import type { ReactNode } from 'react';

import { RecordLoader } from '@/components/record-loader';

import { useUser, type UserDetail } from '../api';
import { UserNotFound } from './user-not-found';

type UserLoaderProps = {
  // null si el id de la URL es imposible: no se pide a la API.
  userId: number | null;
  back: { href: string; label: string };
  children: (user: UserDetail) => ReactNode;
};

export function UserLoader({ userId, back, children }: UserLoaderProps) {
  return (
    <RecordLoader
      validId={userId !== null}
      query={useUser(userId)}
      back={back}
      notFound={<UserNotFound />}
      errorTitle="No pudimos cargar el usuario"
      loadingLabel="Cargando el usuario"
    >
      {children}
    </RecordLoader>
  );
}

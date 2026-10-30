'use client';

import { Plus, UserRoundPlus } from 'lucide-react';
import Link from 'next/link';

import { ButtonLink } from '@/components/button-link';
import { Tag } from '@/components/tag';
import { Skeleton } from '@/components/ui/skeleton';
import { useHasPermission } from '@/features/auth/permissions';
import { formatDocument } from '@/lib/format/document';

import { useClientTravelers, type ClientDetail } from '../api';

// Los acompañantes habituales del cliente. Solo se muestra con `travelers.view`, y sin ese
// permiso tampoco se piden.
export function ClientTravelers({ client }: { client: ClientDetail }) {
  const canView = useHasPermission('travelers.view');
  const canManage = useHasPermission('travelers.manage');
  const travelers = useClientTravelers(client.id, { enabled: canView });
  if (!canView) return null;

  const page = travelers.data;
  const hasOwnTraveler = page?.results.some((item) => item.is_the_client);
  const canRegisterAsTraveler =
    canManage && client.client_type === 'person' && page && !hasOwnTraveler;

  return (
    <section
      aria-labelledby="client-travelers-title"
      className="rounded-md border bg-card"
    >
      <header className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2
          id="client-travelers-title"
          className="font-heading text-lg font-semibold"
        >
          Viajeros de referencia
        </h2>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            {canRegisterAsTraveler && (
              <ButtonLink
                href={`/viajeros/nuevo?from_client=${client.id}`}
                variant="outline"
                size="sm"
              >
                <UserRoundPlus aria-hidden="true" />
                Registrar como viajero
              </ButtonLink>
            )}
            <ButtonLink
              href={`/viajeros/nuevo?client_id=${client.id}`}
              variant="outline"
              size="sm"
            >
              <Plus aria-hidden="true" />
              Nuevo viajero
            </ButtonLink>
          </div>
        )}
      </header>
      {travelers.isError ? (
        <p className="px-5 py-4 text-sm text-muted-foreground">
          No pudimos cargar sus viajeros.{' '}
          <button
            type="button"
            onClick={() => void travelers.refetch()}
            className="underline underline-offset-4"
          >
            Reintentar
          </button>
        </p>
      ) : !page ? (
        <div
          role="status"
          aria-label="Cargando sus viajeros"
          className="px-5 py-4"
        >
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
      ) : page.results.length === 0 ? (
        <p className="px-5 py-4 text-sm text-muted-foreground">
          Este cliente todavía no tiene viajeros registrados.
        </p>
      ) : (
        <ul className="divide-y">
          {page.results.map((traveler) => (
            <li
              key={traveler.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm"
            >
              <Link
                href={`/viajeros/${traveler.id}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {traveler.full_name}
              </Link>
              <span className="font-mono text-[0.75rem] text-muted-foreground">
                {formatDocument(
                  traveler.document_type,
                  traveler.document_number,
                )}
              </span>
              <span className="text-muted-foreground">
                {traveler.age === 1 ? '1 año' : `${traveler.age} años`}
              </span>
              {traveler.is_minor && <Tag>Menor</Tag>}
              {traveler.is_the_client && <Tag tone="accent">Es el cliente</Tag>}
            </li>
          ))}
        </ul>
      )}
      {page?.next && (
        <div className="border-t px-5 py-3">
          <Link
            href={`/viajeros?client_id=${client.id}`}
            className="text-sm underline underline-offset-4"
          >
            Ver todos ({page.count})
          </Link>
        </div>
      )}
    </section>
  );
}

'use client';

import { UserRoundPlus } from 'lucide-react';
import { useState } from 'react';

import { Alert } from '@/components/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useHasPermission } from '@/features/auth/permissions';
import type { ActionFeedback } from '@/lib/action-feedback';

import type { TravelRequestDetail } from '../api';
import { formatTravelers } from '../format';
import { useRequestTravelers } from '../request-travelers-api';
import { checkTravelerCounts } from '../traveler-counts';
import { AddTravelersDialog } from './add-travelers-dialog';
import { RequestTravelersList } from './request-travelers-list';

const messageClass = 'px-5 py-4 text-sm text-muted-foreground';

// Quiénes viajan: personas ya registradas en Viajeros. Solo se muestra con `travelers.view`
// (la lista trae documentos), y sin ese permiso tampoco se pide.
export function RequestTravelersSection({
  request,
}: {
  request: TravelRequestDetail;
}) {
  const canView = useHasPermission('travelers.view');
  const canManage = useHasPermission('travel_requests.manage');
  const travelers = useRequestTravelers(request.id, { enabled: canView });
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState<ActionFeedback>();
  if (!canView) return null;

  const isClosed = request.status === 'closed';
  const canChange = canManage && !isClosed;
  const list = travelers.data;
  const check = list
    ? checkTravelerCounts(request, list)
    : ({ kind: 'none' } as const);

  const done = (text: string) => setFeedback({ variant: 'info', text });

  return (
    <section
      aria-labelledby="request-travelers-title"
      className="rounded-md border bg-card"
    >
      <header className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2
          id="request-travelers-title"
          className="font-heading text-lg font-semibold"
        >
          Viajeros de la solicitud
        </h2>
        {canChange && (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <UserRoundPlus aria-hidden="true" />
            Agregar viajeros
          </Button>
        )}
      </header>
      {feedback && (
        <div className="border-b px-5 py-3">
          <Alert variant={feedback.variant} title={feedback.text} />
        </div>
      )}
      {check.kind !== 'none' && (
        <p role="status" className="border-b bg-foreground/5 px-5 py-3 text-sm">
          {check.text}
        </p>
      )}
      {isClosed && (
        <p className="border-b px-5 py-3 text-sm text-muted-foreground">
          La solicitud está cerrada: sus viajeros no cambian hasta reabrirla.
        </p>
      )}
      {travelers.isError ? (
        <p className={messageClass}>
          No pudimos cargar los viajeros.{' '}
          <button
            type="button"
            onClick={() => void travelers.refetch()}
            className="underline underline-offset-4"
          >
            Reintentar
          </button>
        </p>
      ) : !list ? (
        <div
          role="status"
          aria-label="Cargando los viajeros"
          className="px-5 py-4"
        >
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
      ) : list.length === 0 ? (
        <p className={messageClass}>
          Todavía no hay viajeros asociados. La solicitud pide{' '}
          {formatTravelers(request.adults, request.minors)}.
        </p>
      ) : (
        <RequestTravelersList
          requestId={request.id}
          travelers={list}
          canRemove={canChange}
          onRemoved={done}
        />
      )}
      {/* Se monta al abrirse: cada vez empieza sin la búsqueda ni la selección anterior. */}
      {adding && (
        <AddTravelersDialog
          open={adding}
          onOpenChange={setAdding}
          requestId={request.id}
          client={request.client}
          alreadyAdded={new Set(list?.map((traveler) => traveler.id))}
          onAdded={done}
        />
      )}
    </section>
  );
}

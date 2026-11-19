'use client';

import { useState } from 'react';

import { Alert } from '@/components/alert';
import { Pagination } from '@/components/pagination';
import { SearchInput } from '@/components/search-input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { TRAVELERS_PAGE_SIZE, useTravelers } from '@/features/travelers/api';
import { actionErrorMessage } from '@/lib/action-feedback';
import { isApiError } from '@/lib/api/errors';

import {
  MAX_TRAVELERS_PER_ADD,
  useAddRequestTravelers,
} from '../request-travelers-api';
import { TravelerChoiceList } from './traveler-choice-list';

type AddTravelersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: number;
  client: { id: number; display_name: string };
  // Los que la solicitud ya tiene.
  alreadyAdded: ReadonlySet<number>;
  onAdded: (text: string) => void;
};

// Un 422 aquí quiere decir que alguno de los elegidos ya no existe.
function addErrorMessage(error: unknown) {
  return isApiError(error) && error.status === 422
    ? 'Alguno de los viajeros elegidos ya no existe. Busca de nuevo e inténtalo otra vez.'
    : actionErrorMessage(error);
}

// Elegir uno o varios viajeros ya registrados. Empieza por los del cliente de la solicitud,
// que casi siempre son quienes viajan, y puede ampliarse a todos. Lo elegido se conserva al
// buscar o cambiar de página.
export function AddTravelersDialog({
  open,
  onOpenChange,
  requestId,
  client,
  alreadyAdded,
  onAdded,
}: AddTravelersDialogProps) {
  const [search, setSearch] = useState('');
  const [onlyClients, setOnlyClients] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const add = useAddRequestTravelers(requestId);

  const travelers = useTravelers({
    q: search.trim(),
    clientId: onlyClients ? client.id : null,
    page,
  });
  const data = travelers.data;

  const toggle = (travelerId: number) =>
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(travelerId)) next.add(travelerId);
      return next;
    });

  const submit = () =>
    add.mutate(
      { traveler_ids: [...selected] },
      {
        onSuccess: () => {
          onOpenChange(false);
          onAdded(
            selected.size === 1
              ? 'Viajero agregado a la solicitud.'
              : `${selected.size} viajeros agregados a la solicitud.`,
          );
        },
      },
    );

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!add.isPending) onOpenChange(next);
      }}
    >
      <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold">
            Agregar viajeros
          </AlertDialogTitle>
          <AlertDialogDescription>
            Elige las personas que viajan. Deben estar registradas en Viajeros.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-3">
          <SearchInput
            value={search}
            onValueChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            label="Buscar viajero"
            placeholder="Nombre o documento"
          />
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="size-4 shrink-0 accent-orange-500"
              checked={onlyClients}
              onChange={(event) => {
                setOnlyClients(event.target.checked);
                setPage(1);
              }}
            />
            Solo viajeros de {client.display_name}
          </label>
          {travelers.isError ? (
            <p className="text-sm text-muted-foreground">
              No pudimos cargar los viajeros.{' '}
              <button
                type="button"
                onClick={() => void travelers.refetch()}
                className="underline underline-offset-4"
              >
                Reintentar
              </button>
            </p>
          ) : !data ? (
            <div role="status" aria-label="Cargando viajeros">
              <Skeleton className="h-24 w-full" />
            </div>
          ) : data.results.length === 0 ? (
            <p className="rounded-md border px-3 py-4 text-sm text-muted-foreground">
              {search.trim() === '' && onlyClients
                ? 'Este cliente todavía no tiene viajeros registrados. Quita el filtro para ver los demás.'
                : 'No hay viajeros que coincidan con la búsqueda.'}
            </p>
          ) : (
            <div>
              <TravelerChoiceList
                travelers={data.results}
                selected={selected}
                alreadyAdded={alreadyAdded}
                limitReached={selected.size >= MAX_TRAVELERS_PER_ADD}
                onToggle={toggle}
              />
              {data.count > TRAVELERS_PAGE_SIZE && (
                <Pagination
                  page={page}
                  pageSize={TRAVELERS_PAGE_SIZE}
                  count={data.count}
                  hasPrevious={data.previous !== null}
                  hasNext={data.next !== null}
                  onPageChange={setPage}
                />
              )}
            </div>
          )}
          {selected.size >= MAX_TRAVELERS_PER_ADD && (
            <p className="text-sm text-muted-foreground">
              Se pueden agregar hasta {MAX_TRAVELERS_PER_ADD} viajeros a la vez.
            </p>
          )}
        </div>
        {add.isError && <Alert>{addErrorMessage(add.error)}</Alert>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={add.isPending}>
            Cancelar
          </AlertDialogCancel>
          <Button
            disabled={selected.size === 0 || add.isPending}
            onClick={submit}
          >
            {add.isPending
              ? 'Un momento…'
              : selected.size === 0
                ? 'Agregar'
                : `Agregar (${selected.size})`}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

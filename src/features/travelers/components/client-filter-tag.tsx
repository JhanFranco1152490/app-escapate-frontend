'use client';

import { X } from 'lucide-react';

import { useHasPermission } from '@/features/auth/permissions';
import { useClient } from '@/features/clients/api';

type ClientFilterTagProps = {
  clientId: number;
  onRemove: () => void;
};

// El filtro por cliente de referencia llega desde la ficha del cliente. Su nombre se pide solo
// con `clients.view`; sin ese permiso la etiqueta dice que hay un cliente filtrado.
export function ClientFilterTag({ clientId, onRemove }: ClientFilterTagProps) {
  const canViewClients = useHasPermission('clients.view');
  const client = useClient(canViewClients ? clientId : null);
  const label = client.data
    ? `Cliente: ${client.data.display_name}`
    : 'Cliente filtrado';

  return (
    <div className="flex w-fit items-center gap-1 rounded-md border bg-muted/40 py-1 pr-1 pl-3 text-sm">
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Quitar el filtro por cliente"
        className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}

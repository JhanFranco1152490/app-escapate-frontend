'use client';

import { useState } from 'react';

import { SearchInput } from '@/components/search-input';
import { Button } from '@/components/ui/button';
import { formatDocument } from '@/lib/format/document';

import { useClients, type ClientType } from '../api';

export type PickedClient = {
  id: number;
  name: string;
  type: ClientType | null;
};

const MIN_SEARCH = 2;
const MAX_RESULTS = 8;

type ClientPickerProps = {
  id: string;
  label: string;
  value: PickedClient | null;
  onChange: (client: PickedClient | null) => void;
  // Buscar clientes pide `clients.view`. Sin él se muestra el elegido, pero no se cambia.
  canSearch: boolean;
  // Lo que se dice cuando no hay cliente elegido y no se puede buscar: depende de para qué
  // se elige ("Sin cliente de referencia…").
  unavailableText: string;
  describedBy?: string;
};

// Pensado para otros dominios: elige un cliente buscándolo por nombre, documento, correo o
// teléfono.
export function ClientPicker({
  id,
  label,
  value,
  onChange,
  canSearch,
  unavailableText,
  describedBy,
}: ClientPickerProps) {
  const [search, setSearch] = useState('');
  const q = search.trim();
  const clients = useClients(
    { q, clientType: null, page: 1 },
    { enabled: canSearch && value === null && q.length >= MIN_SEARCH },
  );

  if (value) {
    return (
      <div
        id={id}
        aria-describedby={describedBy}
        className="flex min-h-11 items-center justify-between gap-3 rounded-lg border bg-field px-3.5 py-1.5"
      >
        <span className="truncate text-sm font-medium">{value.name}</span>
        {canSearch && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              onChange(null);
            }}
          >
            Quitar
          </Button>
        )}
      </div>
    );
  }

  if (!canSearch) {
    return (
      <p id={id} className="text-sm text-muted-foreground">
        {unavailableText}
      </p>
    );
  }

  const results = clients.data?.results.slice(0, MAX_RESULTS) ?? [];
  return (
    <div className="flex flex-col gap-2">
      <SearchInput
        id={id}
        label={label}
        placeholder="Busca por nombre, documento o teléfono"
        maxLength={100}
        value={search}
        onValueChange={setSearch}
      />
      {q.length >= MIN_SEARCH && clients.data && (
        <ul
          aria-label="Clientes encontrados"
          className="flex flex-col rounded-lg border bg-card"
        >
          {results.length === 0 ? (
            <li className="px-3.5 py-3 text-sm text-muted-foreground">
              No hay clientes con esa búsqueda.
            </li>
          ) : (
            results.map((client) => (
              <li key={client.id} className="border-t first:border-t-0">
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      id: client.id,
                      name: client.display_name,
                      type: client.client_type,
                    })
                  }
                  className="flex min-h-11 w-full flex-col items-start px-3.5 py-2 text-left hover:bg-muted/60"
                >
                  <span className="text-sm font-medium">
                    {client.display_name}
                  </span>
                  <span className="font-mono text-[0.6875rem] text-muted-foreground">
                    {formatDocument(
                      client.document_type,
                      client.document_number,
                    ) ?? 'Sin documento'}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

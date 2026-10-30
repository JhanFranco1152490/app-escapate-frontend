import { useState } from 'react';

import { isStaleVersion } from './api/errors';

type Refetch<T> = () => Promise<{ data?: T }>;

// Edición con bloqueo optimista. Se envía la versión de la ficha con la que se abrió el
// formulario, aunque la consulta traiga después una más nueva: así, si otra persona guardó en
// el medio, la API lo detecta (409 stale_version) en vez de pisar sus cambios. Ante ese 409
// queda el aviso y lo escrito no se toca hasta que la persona recarga.
export function useVersionedEdit<T extends { version: number }>(
  record: T,
  refetch: Refetch<T>,
) {
  const [opened, setOpened] = useState(record);
  const [stale, setStale] = useState<string>();
  const [reloading, setReloading] = useState(false);

  // Envía con la versión de apertura. Devuelve false si otra persona guardó antes; cualquier
  // otro error sigue su curso (el formulario lo muestra en sus campos).
  const save = async (send: (version: number) => Promise<unknown>) => {
    setStale(undefined);
    try {
      await send(opened.version);
      return true;
    } catch (error) {
      if (!isStaleVersion(error)) throw error;
      setStale((error as Error).message);
      return false;
    }
  };

  // Trae lo que guardó la otra persona y lo deja como la nueva ficha de apertura.
  const reload = async () => {
    setReloading(true);
    const { data } = await refetch();
    setReloading(false);
    if (!data) return;
    setOpened(data);
    setStale(undefined);
  };

  return { opened, stale, reloading, save, reload };
}

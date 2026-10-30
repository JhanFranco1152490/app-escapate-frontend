import Link from 'next/link';

import { Alert } from '@/components/alert';

import type { ClientListItem } from '../api';

// Aviso que no bloquea: el asesor revisa si es la misma persona y decide si sigue.
export function DuplicatePhoneNotice({
  clients,
}: {
  clients: ClientListItem[];
}) {
  if (clients.length === 0) return null;
  const title =
    clients.length === 1
      ? 'Ya hay 1 cliente con este teléfono'
      : `Ya hay ${clients.length} clientes con este teléfono`;
  return (
    <Alert variant="info" title={title}>
      <p>Revisa que no sea el mismo antes de registrarlo de nuevo.</p>
      <ul className="mt-2 flex flex-col gap-1">
        {clients.map((client) => (
          <li key={client.id}>
            {/* En otra pestaña, para no perder lo escrito en el formulario. */}
            <Link
              href={`/clientes/${client.id}`}
              target="_blank"
              className="underline underline-offset-4"
            >
              {client.display_name}
            </Link>
          </li>
        ))}
      </ul>
    </Alert>
  );
}

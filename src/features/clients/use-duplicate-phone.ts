import { useClients } from './api';

// Clientes ya registrados con este teléfono (E.164). El teléfono no es único (en una familia
// se comparte), así que esto solo avisa. Se busca por los dígitos, que la API compara contra
// el teléfono; como la misma búsqueda también mira nombres y documentos, se quedan solo los que
// tienen exactamente ese número.
export function useDuplicatePhone(e164: string | null) {
  const clients = useClients(
    { q: e164?.slice(1) ?? '', clientType: null, page: 1 },
    { enabled: e164 !== null },
  );
  if (e164 === null) return [];
  return clients.data?.results.filter((client) => client.phone === e164) ?? [];
}

import { StatusBadge } from '@/components/status-badge';

export function SupplierStatusBadge({ active }: { active: boolean }) {
  return (
    <StatusBadge
      label={active ? 'Activo' : 'Inactivo'}
      tone={active ? 'ok' : 'inactive'}
    />
  );
}

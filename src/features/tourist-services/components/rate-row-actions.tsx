import { Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { ActionFeedback } from '@/lib/action-feedback';

import type { ServiceRate } from '../rate-api';
import { DeleteRateButton } from './delete-rate-button';

type RateRowActionsProps = {
  serviceId: number;
  rate: ServiceRate;
  onEdit: (rate: ServiceRate) => void;
  onDeleted: (feedback: ActionFeedback) => void;
};

// Editar y borrar en cada fila. El nombre de cada botón dice qué tarifa, porque todas las
// filas tienen los mismos.
export function RateRowActions({
  serviceId,
  rate,
  onEdit,
  onDeleted,
}: RateRowActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 md:justify-end">
      <Button
        variant="outline"
        size="sm"
        aria-label={`Editar ${rate.name}`}
        onClick={() => onEdit(rate)}
      >
        <Pencil aria-hidden="true" />
        Editar
      </Button>
      <DeleteRateButton serviceId={serviceId} rate={rate} onDone={onDeleted} />
    </div>
  );
}

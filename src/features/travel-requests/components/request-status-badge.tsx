import { StatusBadge } from '@/components/status-badge';

import type { TravelRequestStatus } from '../api';
import { STATUS_LABELS, STATUS_TONES } from '../labels';

export function RequestStatusBadge({
  status,
}: {
  status: TravelRequestStatus;
}) {
  return (
    <StatusBadge label={STATUS_LABELS[status]} tone={STATUS_TONES[status]} />
  );
}

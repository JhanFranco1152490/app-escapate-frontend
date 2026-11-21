import { StatusBadge } from '@/components/status-badge';

import type { PaymentStatus } from '../api';
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_TONES } from '../labels';

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <StatusBadge
      label={PAYMENT_STATUS_LABELS[status]}
      tone={PAYMENT_STATUS_TONES[status]}
    />
  );
}

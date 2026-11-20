import { StatusBadge } from '@/components/status-badge';

import type { QuoteListItem } from '../api';
import { STATUS_LABELS, STATUS_TONES, displayStatus } from '../labels';

export function QuoteStatusBadge({
  quote,
}: {
  quote: Pick<QuoteListItem, 'status' | 'is_expired'>;
}) {
  const status = displayStatus(quote);
  return (
    <StatusBadge label={STATUS_LABELS[status]} tone={STATUS_TONES[status]} />
  );
}

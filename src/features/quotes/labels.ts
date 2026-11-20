import type { StatusTone } from '@/components/status-badge';

import type { QuoteListItem, QuoteStatus } from './api';

// "Vencida" no es un estado guardado: es una enviada cuya vigencia ya pasó. Se muestra como
// uno más porque es lo que el asesor tiene que atender.
export type QuoteDisplayStatus = QuoteStatus | 'expired';

export const STATUS_LABELS: Record<QuoteDisplayStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  expired: 'Vencida',
};

export const STATUS_TONES: Record<QuoteDisplayStatus, StatusTone> = {
  draft: 'pending',
  sent: 'pending',
  accepted: 'ok',
  rejected: 'inactive',
  expired: 'inactive',
};

export const displayStatus = (
  quote: Pick<QuoteListItem, 'status' | 'is_expired'>,
): QuoteDisplayStatus => (quote.is_expired ? 'expired' : quote.status);

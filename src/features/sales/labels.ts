import type { StatusTone } from '@/components/status-badge';

import type { PaymentMethod, PaymentStatus } from './api';

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Sin pagos',
  partial: 'Con abonos',
  paid: 'Pagada',
};

export const PAYMENT_STATUS_TONES: Record<PaymentStatus, StatusTone> = {
  pending: 'pending',
  partial: 'pending',
  paid: 'ok',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  transfer: 'Transferencia',
  cash: 'Efectivo',
  card: 'Tarjeta',
  other: 'Otro',
};

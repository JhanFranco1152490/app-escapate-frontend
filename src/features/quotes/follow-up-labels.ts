import type { AlertColor, FollowUpChannel } from './follow-up-api';

export const CHANNEL_LABELS: Record<FollowUpChannel, string> = {
  call: 'Llamada',
  whatsapp: 'WhatsApp',
  email: 'Correo',
  meeting: 'Reunión',
  other: 'Otro',
};

// El semáforo: el color acompaña a la etiqueta, nunca la reemplaza.
export const ALERT_LABELS: Record<AlertColor, string> = {
  red: 'Vencido',
  yellow: 'Hoy o mañana',
  green: 'Programado',
};

export const ALERT_DOTS: Record<AlertColor, string> = {
  red: 'bg-red-600',
  yellow: 'bg-amber-400',
  green: 'bg-emerald-600',
};

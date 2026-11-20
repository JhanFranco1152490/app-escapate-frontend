import { cn } from 'cn';

import type { FollowUp } from '../follow-up-api';
import { ALERT_DOTS, ALERT_LABELS } from '../follow-up-labels';

// El color del semáforo de un seguimiento pendiente, o "Registrado" si ya se hizo.
export function AlertLight({
  followUp,
}: {
  followUp: Pick<FollowUp, 'alert' | 'status'>;
}) {
  const label = followUp.alert ? ALERT_LABELS[followUp.alert] : 'Registrado';
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[0.625rem] tracking-[0.12em] uppercase">
      <span
        aria-hidden="true"
        className={cn(
          'size-2.5 rounded-full',
          followUp.alert
            ? ALERT_DOTS[followUp.alert]
            : 'border border-muted-foreground',
        )}
      />
      {label}
    </span>
  );
}

'use client';

import { BellRing } from 'lucide-react';

import { ButtonLink } from '@/components/button-link';
import { useHasPermission } from '@/features/auth/permissions';

import { useAlertSummary } from '../follow-up-api';

// La alerta al entrar al panel: cuántos seguimientos están vencidos o vencen hoy o mañana.
export function FollowUpAlertsBanner() {
  const canView = useHasPermission('quotes.view');
  const summary = useAlertSummary(canView);
  if (!canView || !summary.data) return null;
  const { red, yellow } = summary.data;
  if (red + yellow === 0) return null;

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-md border border-orange-300 bg-orange-50 px-5 py-4 text-orange-950 sm:flex-row sm:items-center sm:justify-between dark:bg-orange-950/30 dark:text-orange-100"
    >
      <p className="flex items-center gap-3 text-sm">
        <BellRing className="size-5 shrink-0" aria-hidden="true" />
        <span>
          {red > 0 && <strong>{red} vencidos</strong>}
          {red > 0 && yellow > 0 && ' y '}
          {yellow > 0 && <strong>{yellow} para hoy o mañana</strong>} en tus
          seguimientos comerciales.
        </span>
      </p>
      <ButtonLink href="/seguimientos" variant="outline">
        Ver seguimientos
      </ButtonLink>
    </div>
  );
}

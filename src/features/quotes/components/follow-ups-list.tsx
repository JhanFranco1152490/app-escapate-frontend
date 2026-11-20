'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useHasPermission } from '@/features/auth/permissions';
import { formatDateTime, formatShortDate } from '@/lib/format/dates';

import { useRemoveFollowUp, type FollowUp } from '../follow-up-api';
import { CHANNEL_LABELS } from '../follow-up-labels';
import { AlertLight } from './alert-light';
import { CompleteFollowUpDialog } from './complete-follow-up-dialog';

type FollowUpsListProps = {
  followUps: FollowUp[];
  // En la lista general se dice de qué cotización es; en la ficha de la cotización no.
  showQuote?: boolean;
  onDone: (text: string) => void;
};

export function FollowUpsList({
  followUps,
  showQuote,
  onDone,
}: FollowUpsListProps) {
  const canManage = useHasPermission('quotes.manage');
  const [completing, setCompleting] = useState<FollowUp>();
  const remove = useRemoveFollowUp();

  return (
    <>
      <ul className="divide-y">
        {followUps.map((followUp) => (
          <li
            key={followUp.id}
            className="flex flex-col gap-2 px-5 py-3 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-3">
                <AlertLight followUp={followUp} />
                <span className="text-sm font-medium">
                  {formatShortDate(followUp.due_date)} ·{' '}
                  {CHANNEL_LABELS[followUp.channel]}
                </span>
                {showQuote && (
                  <Link
                    href={`/cotizaciones/${followUp.quote.id}`}
                    className="font-mono text-[0.75rem] underline-offset-4 hover:underline"
                  >
                    {followUp.quote.code} · {followUp.quote.client.display_name}
                  </Link>
                )}
              </div>
              <p className="text-sm">{followUp.purpose}</p>
              {followUp.status === 'done' && (
                <p className="text-sm whitespace-pre-line text-muted-foreground">
                  {followUp.outcome ?? 'Sin observaciones.'} — Registrado por{' '}
                  {followUp.done_by?.full_name} el{' '}
                  {followUp.done_at && formatDateTime(followUp.done_at)}
                </p>
              )}
            </div>
            {canManage && followUp.status === 'pending' && (
              <div className="flex shrink-0 gap-2">
                <Button size="sm" onClick={() => setCompleting(followUp)}>
                  Registrar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={remove.isPending}
                  onClick={() =>
                    remove.mutate(followUp.id, {
                      onSuccess: () => onDone('Seguimiento quitado.'),
                    })
                  }
                >
                  Quitar
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {completing && (
        <CompleteFollowUpDialog
          followUp={completing}
          onClose={() => setCompleting(undefined)}
          onDone={() => {
            setCompleting(undefined);
            onDone('Seguimiento registrado.');
          }}
        />
      )}
    </>
  );
}

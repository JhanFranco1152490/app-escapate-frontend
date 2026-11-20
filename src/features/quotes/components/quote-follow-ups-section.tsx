'use client';

import { useState } from 'react';

import { Alert } from '@/components/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { useHasPermission } from '@/features/auth/permissions';
import { actionErrorMessage } from '@/lib/action-feedback';

import type { QuoteDetail } from '../api';
import {
  useFollowUps,
  useScheduleFollowUp,
  type FollowUpChannel,
} from '../follow-up-api';
import { CHANNEL_LABELS } from '../follow-up-labels';
import { FollowUpsList } from './follow-ups-list';

function ScheduleForm({
  quoteId,
  onDone,
}: {
  quoteId: number;
  onDone: () => void;
}) {
  const schedule = useScheduleFollowUp(quoteId);
  const [dueDate, setDueDate] = useState('');
  const [channel, setChannel] = useState<FollowUpChannel>('whatsapp');
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState<string>();

  const save = () => {
    if (!dueDate || !purpose.trim()) {
      setError('Indica la fecha y para qué es el contacto.');
      return;
    }
    setError(undefined);
    schedule.mutate(
      { due_date: dueDate, channel, purpose: purpose.trim() },
      {
        onSuccess: () => {
          setDueDate('');
          setPurpose('');
          onDone();
        },
        onError: (failure) => setError(actionErrorMessage(failure)),
      },
    );
  };

  return (
    <div className="flex flex-col gap-3 border-t px-5 py-4">
      {error && <Alert title={error} />}
      <div className="grid gap-3 md:grid-cols-[10rem_10rem_1fr_auto] md:items-end">
        <div className="flex flex-col gap-2">
          <Label htmlFor="follow-up-date">Fecha</Label>
          <Input
            id="follow-up-date"
            type="date"
            className="h-11"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="follow-up-channel">Medio</Label>
          <NativeSelect
            id="follow-up-channel"
            className="w-full"
            value={channel}
            onChange={(event) =>
              setChannel(event.target.value as FollowUpChannel)
            }
          >
            {Object.entries(CHANNEL_LABELS).map(([code, label]) => (
              <NativeSelectOption key={code} value={code}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="follow-up-purpose">Para qué</Label>
          <Input
            id="follow-up-purpose"
            maxLength={300}
            className="h-11"
            placeholder="Confirmar si revisó la propuesta"
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
          />
        </div>
        <Button onClick={save} disabled={schedule.isPending}>
          Programar
        </Button>
      </div>
    </div>
  );
}

// Los contactos con el cliente sobre esta cotización: los pendientes con su semáforo y los
// ya registrados con lo que respondió.
export function QuoteFollowUpsSection({ quote }: { quote: QuoteDetail }) {
  const canManage = useHasPermission('quotes.manage');
  const [feedback, setFeedback] = useState<string>();
  const followUps = useFollowUps({
    status: null,
    alert: null,
    quoteId: quote.id,
    page: 1,
  });
  const open = quote.status === 'draft' || quote.status === 'sent';
  const rows = followUps.data?.results ?? [];

  return (
    <section
      aria-labelledby="quote-follow-ups-title"
      className="rounded-md border bg-card"
    >
      <h2
        id="quote-follow-ups-title"
        className="border-b px-5 py-4 font-heading text-lg font-semibold"
      >
        Seguimiento comercial
      </h2>
      {feedback && (
        <div className="px-5 pt-4">
          <Alert variant="info" title={feedback} />
        </div>
      )}
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">
          {followUps.isPending
            ? 'Cargando…'
            : 'No hay seguimientos programados.'}
        </p>
      ) : (
        <FollowUpsList followUps={rows} onDone={setFeedback} />
      )}
      {canManage && open && (
        <ScheduleForm
          quoteId={quote.id}
          onDone={() => setFeedback('Seguimiento programado.')}
        />
      )}
    </section>
  );
}

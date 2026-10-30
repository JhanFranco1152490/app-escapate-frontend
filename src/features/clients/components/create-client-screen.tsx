'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { PageHeader } from '@/components/page-header';
import { setPageNotice } from '@/lib/page-notice';

import { useCreateClient } from '../api';
import { clientNoticeTarget } from '../client-notice';
import { EMPTY_CLIENT_FORM } from '../form-values';
import type { ClientPayload } from '../schemas';
import { useDuplicatePhone } from '../use-duplicate-phone';
import { ClientForm } from './client-form';
import { DuplicatePhoneNotice } from './duplicate-phone-notice';

export function CreateClientScreen() {
  const router = useRouter();
  const createClient = useCreateClient();
  const [phone, setPhone] = useState<string | null>(null);
  const duplicates = useDuplicatePhone(phone);

  const submit = async (payload: ClientPayload) => {
    // El formulario no deja enviar sin la casilla marcada.
    const client = await createClient.mutateAsync({
      ...payload,
      data_consent: true,
    });
    setPageNotice({
      target: clientNoticeTarget(client.id),
      text: 'Cliente registrado.',
    });
    router.push(`/clientes/${client.id}`);
  };

  return (
    <div className="flex max-w-3xl flex-col gap-7">
      <PageHeader
        eyebrow="Operación / 02"
        title="Nuevo cliente"
        description="Registra a quien contrata el viaje. Los viajeros que lo acompañan se registran aparte."
      />
      <ClientForm
        mode="create"
        defaultValues={EMPTY_CLIENT_FORM}
        submitLabel="Guardar cliente"
        cancelHref="/clientes"
        onSubmit={submit}
        onPhoneCommit={setPhone}
        notices={<DuplicatePhoneNotice clients={duplicates} />}
      />
    </div>
  );
}

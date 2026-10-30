import { CircleAlert } from 'lucide-react';
import { useWatch } from 'react-hook-form';

import { fieldErrorId } from '@/components/form-field';
import { Label } from '@/components/ui/label';
import { useHasPermission } from '@/features/auth/permissions';
import {
  ClientPicker,
  type PickedClient,
} from '@/features/clients/components/client-picker';

import type { TravelerFormApi } from '../schemas';

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p
      id={fieldErrorId(id)}
      className="flex items-center gap-1.5 text-[0.78125rem] text-destructive"
    >
      <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
      {error}
    </p>
  );
}

// Con quién viaja habitualmente: opcional, y solo sirve para encontrar rápido a los
// acompañantes de un cliente. "Es el mismo cliente" enlaza la ficha de viajero de una persona
// con su ficha de cliente.
export function ReferenceClientField({ form }: { form: TravelerFormApi }) {
  const canSearch = useHasPermission('clients.view');
  const {
    register,
    setValue,
    clearErrors,
    control,
    formState: { errors },
  } = form;
  const [id, name, type] = useWatch({
    control,
    name: [
      'reference_client_id',
      'reference_client_name',
      'reference_client_type',
    ],
  });
  const value: PickedClient | null = id === null ? null : { id, name, type };
  const error = errors.reference_client_id?.message;

  const change = (client: PickedClient | null) => {
    const options = { shouldDirty: true };
    setValue('reference_client_id', client?.id ?? null, options);
    setValue('reference_client_name', client?.name ?? '', options);
    setValue('reference_client_type', client?.type ?? null, options);
    // Una empresa no viaja: si se quita el cliente o se elige una empresa, deja de ser él.
    if (client?.type !== 'person') setValue('is_the_client', false, options);
    clearErrors(['reference_client_id', 'is_the_client']);
  };

  return (
    <div className="flex flex-col gap-2 md:col-span-2">
      <Label htmlFor="reference_client">Cliente de referencia</Label>
      <ClientPicker
        id="reference_client"
        label="Buscar cliente de referencia"
        value={value}
        onChange={change}
        canSearch={canSearch}
        describedBy={error ? fieldErrorId('reference_client_id') : undefined}
      />
      <FieldError id="reference_client_id" error={error} />
      {value && value.type !== 'company' && (
        <label className="flex min-h-11 w-fit items-center gap-2.5 text-[0.875rem]">
          <input
            type="checkbox"
            className="size-4 accent-orange-500"
            {...register('is_the_client')}
          />
          Es el mismo cliente
        </label>
      )}
      <FieldError id="is_the_client" error={errors.is_the_client?.message} />
    </div>
  );
}

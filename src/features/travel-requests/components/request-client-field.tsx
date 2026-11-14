import Link from 'next/link';
import { useWatch } from 'react-hook-form';

import { FormField, fieldErrorId } from '@/components/form-field';
import { useHasPermission } from '@/features/auth/permissions';
import {
  ClientPicker,
  type PickedClient,
} from '@/features/clients/components/client-picker';

import type { RequestFormApi } from '../schemas';

const UNAVAILABLE =
  'Para elegir el cliente se necesita el permiso de ver clientes.';

type RequestClientFieldProps = {
  form: RequestFormApi;
  // El cliente de una solicitud no se cambia: en la edición solo se muestra.
  fixed: boolean;
};

export function RequestClientField({ form, fixed }: RequestClientFieldProps) {
  const canSearch = useHasPermission('clients.view') && !fixed;
  const canCreate = useHasPermission('clients.manage') && !fixed;
  const {
    control,
    setValue,
    clearErrors,
    formState: { errors },
  } = form;
  const [id, name] = useWatch({ control, name: ['client_id', 'client_name'] });
  const value: PickedClient | null =
    id === null ? null : { id, name, type: null };
  const error = errors.client_id?.message;

  const change = (client: PickedClient | null) => {
    setValue('client_id', client?.id ?? null, { shouldDirty: true });
    setValue('client_name', client?.name ?? '', { shouldDirty: true });
    clearErrors('client_id');
  };

  return (
    <div className="md:col-span-2">
      <FormField id="client" label="Cliente" required error={error}>
        <ClientPicker
          id="client"
          label="Buscar cliente"
          value={value}
          onChange={change}
          canSearch={canSearch}
          unavailableText={UNAVAILABLE}
          describedBy={error ? fieldErrorId('client') : undefined}
        />
        {canCreate && value === null && (
          <p className="text-[0.78125rem] text-muted-foreground">
            ¿No está registrado?{' '}
            <Link
              href="/clientes/nuevo?next=/solicitudes/nueva"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Crear cliente
            </Link>
          </p>
        )}
      </FormField>
    </div>
  );
}

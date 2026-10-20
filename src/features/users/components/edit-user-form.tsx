'use client';

import { useRouter } from 'next/navigation';

import { PageHeader } from '@/components/page-header';

import { useUpdateUser, type UserDetail } from '../api';
import { setSavedNotice } from '../saved-notice';
import type { CreateUserValues, UserFormValues } from '../schemas';
import { UserForm } from './user-form';

const toFormValues = (user: UserDetail): UserFormValues => ({
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
  document_type: user.document_type,
  document_number: user.document_number,
  // Las cuentas anteriores al celular obligatorio no lo tienen: se pide al guardar.
  phone: user.phone ?? '',
  // Fijo: el rol no se cambia aquí, solo viaja en los valores para validar con el mismo
  // schema del alta.
  role_id: String(user.role.id),
});

export function EditUserForm({ user }: { user: UserDetail }) {
  const router = useRouter();
  const updateUser = useUpdateUser(user.id);

  // Solo los cinco datos editables: la API rechaza el rol y el estado en este endpoint.
  const submit = async (values: CreateUserValues) => {
    const { invitation_sent } = await updateUser.mutateAsync({
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      document_type: values.document_type,
      document_number: values.document_number,
      phone: values.phone,
    });
    setSavedNotice({
      userId: user.id,
      kind: 'updated',
      invitationSent: invitation_sent,
    });
    router.push(`/usuarios/${user.id}`);
  };

  return (
    <div className="flex max-w-3xl flex-col gap-7">
      <PageHeader
        eyebrow="Administración / 02"
        title="Editar usuario"
        description={`Corrige los datos de ${user.full_name}. El estado de la cuenta se cambia desde su ficha.`}
      />
      {/* Los valores se fijan al montar: una nueva lectura de la ficha no pisa lo que se
          está escribiendo. */}
      <UserForm
        defaultValues={toFormValues(user)}
        roleName={user.role.name}
        submitLabel="Guardar cambios"
        cancelHref={`/usuarios/${user.id}`}
        onSubmit={submit}
      />
    </div>
  );
}

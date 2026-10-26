'use client';

import { useRouter } from 'next/navigation';

import { Alert } from '@/components/alert';
import { PageHeader } from '@/components/page-header';

import { useCreateUser } from '../api';
import { setSavedNotice } from '../saved-notice';
import type { CreateUserValues, UserFormValues } from '../schemas';
import { UserForm } from './user-form';

const EMPTY_USER: UserFormValues = {
  first_name: '',
  last_name: '',
  email: '',
  document_type: 'CC',
  document_number: '',
  phone: '',
  role_id: '',
};

export function CreateUserScreen() {
  const router = useRouter();
  const createUser = useCreateUser();

  const submit = async (values: CreateUserValues) => {
    const { user, invitation_sent } = await createUser.mutateAsync(values);
    setSavedNotice({
      userId: user.id,
      kind: 'created',
      invitationSent: invitation_sent,
    });
    router.push(`/usuarios/${user.id}`);
  };

  return (
    <div className="flex max-w-3xl flex-col gap-7">
      <PageHeader
        eyebrow="Administración / 02"
        title="Nuevo usuario"
        description="Crea la cuenta y asígnale un rol. Recibirá un correo para crear su propia contraseña."
      />
      <Alert variant="info" title="Antes de crear la cuenta">
        <p>
          Pídele a la persona que active la verificación en dos pasos de su
          Gmail: con ese correo también podrá entrar al panel usando Google.
        </p>
      </Alert>
      <UserForm
        defaultValues={EMPTY_USER}
        submitLabel="Crear usuario"
        cancelHref="/usuarios"
        onSubmit={submit}
      />
    </div>
  );
}

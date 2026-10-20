'use client';

import { parseUserId } from '../user-id';
import { EditUserForm } from './edit-user-form';
import { UserLoader } from './user-loader';

export function EditUserScreen({ id }: { id: string }) {
  const userId = parseUserId(id);

  return (
    <UserLoader
      userId={userId}
      back={{ href: `/usuarios/${id}`, label: 'Volver a la ficha' }}
    >
      {(user) => <EditUserForm user={user} />}
    </UserLoader>
  );
}

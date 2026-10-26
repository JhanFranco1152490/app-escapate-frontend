import type { ReactNode } from 'react';

import { DOCUMENT_TYPE_LABELS } from '@/features/auth/schemas';
import { formatDateTime } from '@/lib/format/dates';

import type { UserDetail as UserDetailData } from '../api';
import { formatPhone } from '../format-phone';
import { UserStatusBadge } from './user-status-badge';

function Item({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="font-mono text-[0.625rem] tracking-[0.16em] text-muted-foreground uppercase">
        {term}
      </dt>
      <dd className="text-sm break-words">{children}</dd>
    </div>
  );
}

type UserDetailProps = {
  user: UserDetailData;
  // Acción junto al rol ("Cambiar rol"), según los permisos de quien mira.
  roleAction?: ReactNode;
};

export function UserDetail({ user, roleAction }: UserDetailProps) {
  return (
    <section
      aria-labelledby="user-data-title"
      className="rounded-md border bg-card"
    >
      <h2
        id="user-data-title"
        className="border-b px-5 py-4 font-heading text-lg font-semibold"
      >
        Datos de la persona
      </h2>
      <dl className="grid gap-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
        <Item term="Correo">{user.email}</Item>
        <Item term="Documento">
          {/* La sigla, como se escribe en los documentos; el nombre completo queda para
              quien pase el mouse o use lector de pantalla. */}
          <abbr
            title={DOCUMENT_TYPE_LABELS[user.document_type]}
            className="no-underline"
          >
            {user.document_type}
          </abbr>{' '}
          {user.document_number}
        </Item>
        <Item term="Celular">
          {user.phone ? formatPhone(user.phone) : 'Sin registrar'}
        </Item>
        <Item term="Rol">
          {user.role.name}
          {roleAction}
        </Item>
        <Item term="Estado">
          <UserStatusBadge user={user} />
        </Item>
        <Item term="Última actividad">
          {user.last_activity_at
            ? formatDateTime(user.last_activity_at)
            : 'Nunca'}
        </Item>
        <Item term="Creado">{formatDateTime(user.created_at)}</Item>
        <Item term="Google">
          {user.google_linked ? 'Vinculado' : 'No vinculado'}
        </Item>
        <Item term="Contraseña">
          {user.has_password ? 'Creada' : 'Pendiente'}
        </Item>
      </dl>
    </section>
  );
}

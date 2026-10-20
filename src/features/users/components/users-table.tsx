import Link from 'next/link';

import { formatShortDateTime } from '@/lib/format/dates';

import type { ActionFeedback } from '../action-feedback';
import type { UserListItem } from '../api';
import { UserRowActions } from './user-row-actions';
import { UserStatusBadge } from './user-status-badge';

const headerCell =
  'h-10.5 px-4 text-left font-mono text-[0.59375rem] font-normal tracking-[0.16em] text-muted-foreground uppercase';
// Por debajo de md cada fila es una tarjeta: mismo marcado, sin una segunda copia de los
// datos para celular.
const cell = 'px-4 md:h-13.5 md:py-2';

type UsersTableProps = {
  users: UserListItem[];
  onActionDone: (feedback: ActionFeedback) => void;
};

export function UsersTable({ users, onActionDone }: UsersTableProps) {
  return (
    <table className="w-full text-sm md:table-fixed">
      <colgroup className="max-md:hidden">
        <col />
        <col className="w-[20%]" />
        <col className="w-[17%]" />
        <col className="w-[21%]" />
        <col className="w-14" />
      </colgroup>
      <thead className="bg-muted/60 max-md:sr-only">
        <tr>
          <th scope="col" className={headerCell}>
            Usuario
          </th>
          <th scope="col" className={headerCell}>
            Rol
          </th>
          <th scope="col" className={headerCell}>
            Estado
          </th>
          <th scope="col" className={headerCell}>
            Última actividad
          </th>
          <th scope="col" className={headerCell}>
            <span className="sr-only">Acciones</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr
            key={user.id}
            className="relative border-t max-md:flex max-md:flex-col max-md:gap-1.5 max-md:py-3.5"
          >
            <td className={`${cell} min-w-0 max-md:pr-14`}>
              <Link
                href={`/usuarios/${user.id}`}
                className="block truncate font-medium underline-offset-4 hover:underline"
              >
                {user.full_name}
              </Link>
              <span className="block truncate font-mono text-[0.6875rem] text-muted-foreground">
                {user.email}
              </span>
            </td>
            <td className={`${cell} truncate`}>{user.role.name}</td>
            <td className={cell}>
              <UserStatusBadge user={user} />
            </td>
            <td
              className={`${cell} font-mono text-[0.75rem] text-muted-foreground`}
            >
              <span className="md:hidden">Última actividad: </span>
              {user.last_activity_at
                ? formatShortDateTime(user.last_activity_at)
                : 'Nunca'}
            </td>
            <td className="max-md:absolute max-md:top-1.5 max-md:right-2 md:px-2 md:text-right">
              <UserRowActions user={user} onDone={onActionDone} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

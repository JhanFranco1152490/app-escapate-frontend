import {
  clearPageNotice,
  readPageNotice,
  setPageNotice,
} from '@/lib/page-notice';

// A dónde va el aviso: la página de un rol ("Rol creado.") o la lista ("Rol borrado.").
export type RoleNoticeTarget = number | 'list';

export const roleNoticeKey = (target: RoleNoticeTarget) =>
  target === 'list' ? 'roles' : `role:${target}`;

export const setRoleNotice = ({
  target,
  text,
}: {
  target: RoleNoticeTarget;
  text: string;
}) => setPageNotice({ target: roleNoticeKey(target), text });

export const readRoleNotice = (target: RoleNoticeTarget) =>
  readPageNotice(roleNoticeKey(target));

export const clearRoleNotice = clearPageNotice;

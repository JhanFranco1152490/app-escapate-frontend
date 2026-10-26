import { usePageNotice } from '@/lib/use-page-notice';

import { roleNoticeKey, type RoleNoticeTarget } from './role-notice';

export const useRoleNotice = (target: RoleNoticeTarget) =>
  usePageNotice(roleNoticeKey(target));

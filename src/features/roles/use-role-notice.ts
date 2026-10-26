import { useEffect, useState } from 'react';

import { clearRoleNotice, readRoleNotice } from './role-notice';

type NoticeTarget = Parameters<typeof readRoleNotice>[0];

// El aviso que dejó la pantalla anterior para esta: se lee al montar y se borra después, para
// que no vuelva a aparecer.
export function useRoleNotice(target: NoticeTarget) {
  const [notice] = useState(() => readRoleNotice(target));
  useEffect(() => {
    if (notice) clearRoleNotice();
  }, [notice]);
  return notice;
}

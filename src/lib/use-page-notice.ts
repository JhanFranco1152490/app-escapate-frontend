import { useEffect, useState } from 'react';

import { clearPageNotice, readPageNotice } from './page-notice';

// El aviso que dejó la pantalla anterior para esta: se lee al montar y se borra después, para
// que no vuelva a aparecer.
export function usePageNotice(target: string) {
  const [notice] = useState(() => readPageNotice(target));
  useEffect(() => {
    if (notice) clearPageNotice();
  }, [notice]);
  return notice;
}

'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

import { useCurrentUser } from '@/features/auth/components/session-guard';

import { visibleNavGroups } from './nav-items';

export function useNavGroups() {
  const user = useCurrentUser();
  const pathname = usePathname();
  const groups = useMemo(() => visibleNavGroups(user), [user]);
  return { groups, pathname };
}

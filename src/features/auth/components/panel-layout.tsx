'use client';

import { LogOut } from 'lucide-react';
import Image from 'next/image';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

import { AccountMenu } from './account-menu';
import { RoleBadge } from './role-badge';
import { useCurrentUser, useSignOut } from './session-guard';
import { UserAvatar } from './user-avatar';

export function PanelLayout({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  const { signOut, signingOut } = useSignOut();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b px-4 md:h-18 md:px-9">
        <Image
          src="/brand/escapate-logo-color.png"
          alt="Escápate, agencia de viajes"
          width={600}
          height={364}
          priority
          className="h-auto w-20 md:w-24"
        />
        <div className="hidden items-center gap-4.5 md:flex">
          <div className="flex items-center gap-2.75">
            <UserAvatar name={user.full_name} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.84375rem] leading-none font-medium">
                {user.full_name}
              </span>
              <RoleBadge name={user.role.name} />
            </div>
          </div>
          <span aria-hidden="true" className="h-7 w-px bg-border" />
          <Button
            variant="ghost"
            disabled={signingOut}
            onClick={() => void signOut()}
          >
            <LogOut aria-hidden="true" />
            Cerrar sesión
          </Button>
        </div>
        <div className="md:hidden">
          <AccountMenu
            user={user}
            loggingOut={signingOut}
            onLogout={() => void signOut()}
          />
        </div>
      </header>
      <main className="flex flex-1 flex-col px-4 py-8 md:px-9">{children}</main>
    </div>
  );
}

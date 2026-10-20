'use client';

import { LogOut } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { SessionUser } from '@/features/auth/api';
import { isNavItemActive } from '../nav-items';
import { useNavGroups } from '../use-nav-groups';
import { RoleBadge } from './role-badge';
import { UserAvatar } from './user-avatar';

type AccountMenuProps = {
  user: SessionUser;
  onLogout: () => void;
  loggingOut: boolean;
};

// Versión de celular de la cuenta: en pantallas angostas no caben nombre, rol, el botón de
// cierre ni la barra lateral, así que las entradas del menú también van aquí.
export function AccountMenu({ user, onLogout, loggingOut }: AccountMenuProps) {
  const { groups, pathname } = useNavGroups();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Menú de la cuenta"
            className="rounded-full"
          />
        }
      >
        <UserAvatar name={user.full_name} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-1.5 py-2 text-foreground">
            <span className="text-sm font-medium">{user.full_name}</span>
            <RoleBadge name={user.role.name} />
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {groups.map((group) => (
          <DropdownMenuGroup key={group.label}>
            <DropdownMenuLabel className="font-mono text-[0.59375rem] tracking-[0.2em] uppercase">
              {group.label}
            </DropdownMenuLabel>
            {group.items.map((item) => (
              <DropdownMenuItem
                key={item.href}
                className="min-h-11"
                render={
                  <Link
                    href={item.href}
                    aria-current={
                      isNavItemActive(item, pathname) ? 'page' : undefined
                    }
                  />
                }
              >
                <item.icon aria-hidden="true" />
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="min-h-11"
          disabled={loggingOut}
          onClick={onLogout}
        >
          <LogOut aria-hidden="true" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

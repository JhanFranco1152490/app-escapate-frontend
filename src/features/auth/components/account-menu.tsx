'use client';

import { LogOut } from 'lucide-react';

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

import type { SessionUser } from '../api';
import { RoleBadge } from './role-badge';
import { UserAvatar } from './user-avatar';

type AccountMenuProps = {
  user: SessionUser;
  onLogout: () => void;
  loggingOut: boolean;
};

// Versión de celular de la cuenta: en pantallas angostas no caben nombre, rol y el botón
// de cierre en la barra.
export function AccountMenu({ user, onLogout, loggingOut }: AccountMenuProps) {
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

'use client';

import {
  Briefcase,
  ChevronDown,
  ClipboardList,
  FlaskConical,
  Handshake,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  DEMO_ACCOUNTS,
  type DemoAccount,
  type DemoAccountKey,
} from '../demo-accounts';
import type { LoginValues } from '../schemas';

const ROLE_ICONS: Record<DemoAccountKey, LucideIcon> = {
  administrator: ShieldCheck,
  advisor: Briefcase,
  suppliers: Handshake,
  operations: ClipboardList,
};

type DemoAccountsMenuProps = {
  onSelect: (values: LoginValues) => void;
  disabled?: boolean;
};

function credentialsOf(account: DemoAccount): LoginValues {
  return {
    document_type: account.document_type,
    document_number: account.document_number,
    password: account.password,
  };
}

export function DemoAccountsMenu({
  onSelect,
  disabled,
}: DemoAccountsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className="group flex min-h-14 w-full items-center gap-3 rounded-lg border border-dashed border-orange-400/50 bg-orange-400/10 px-3.5 py-2 text-left transition-colors outline-none hover:bg-orange-400/15 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-popup-open:bg-orange-400/15"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-400/15 text-orange-400">
          <FlaskConical className="size-4.5" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-mono text-[0.625rem] tracking-[0.2em] text-orange-400 uppercase">
            Entorno de pruebas
          </span>
          <span className="text-sm font-medium text-foreground">
            Entrar con una cuenta de demostración
          </span>
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform group-data-popup-open:rotate-180"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>
      {/* dark-surface: el menú se monta fuera del login y, sin esto, saldría con el tema claro. */}
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="dark-surface p-1.5"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 pt-1 pb-1.5 font-mono text-[0.59375rem] tracking-[0.2em] uppercase">
            Un clic y entras con ese rol
          </DropdownMenuLabel>
          {DEMO_ACCOUNTS.map((account) => {
            const Icon = ROLE_ICONS[account.key];
            return (
              <DropdownMenuItem
                key={account.key}
                className="min-h-14 gap-3 px-2 py-2"
                onClick={() => onSelect(credentialsOf(account))}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-400/10 text-orange-400">
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {account.role}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {account.summary}
                  </span>
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

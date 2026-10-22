'use client';

import { cn } from 'cn';
import Link from 'next/link';

import { isNavItemActive } from '../nav-items';
import { useNavGroups } from '../use-nav-groups';

// Barra lateral desde md; en celular las mismas entradas van en el menú de la cuenta.
export function PanelNav() {
  const { groups, pathname } = useNavGroups();

  return (
    <nav
      aria-label="Navegación principal"
      className="hidden w-63 shrink-0 flex-col gap-6 border-r border-sidebar-border bg-sidebar py-6.5 text-sidebar-foreground md:flex"
    >
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-0.75">
          <p className="px-6 pb-2.25 font-mono text-[0.59375rem] tracking-[0.2em] text-sidebar-foreground/72 uppercase">
            {group.label}
          </p>
          {group.items.map((item) => {
            const active = isNavItemActive(item, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-11 items-center gap-3 px-6 text-sm text-sidebar-foreground/72 transition-colors hover:text-sidebar-foreground',
                  active &&
                    'bg-sidebar-accent font-medium text-sidebar-foreground shadow-[inset_3px_0_0_0_var(--sidebar-primary)]',
                )}
              >
                <item.icon aria-hidden="true" className="size-4.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

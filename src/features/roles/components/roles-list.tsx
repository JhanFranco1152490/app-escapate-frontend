'use client';

import { cn } from 'cn';
import { RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useRoles } from '../api';
import { RoleCount } from './role-count';

// El rol abierto es el de la ruta, también en sus subrutas.
function isOpen(roleId: number, pathname: string) {
  const href = `/roles/${roleId}`;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function RolesList() {
  const roles = useRoles();
  const pathname = usePathname();

  if (roles.isError)
    return (
      <div className="flex flex-col items-start gap-3 p-5 text-[0.84375rem]">
        <p className="text-muted-foreground">No pudimos cargar los roles.</p>
        <Button variant="outline" onClick={() => void roles.refetch()}>
          <RotateCcw aria-hidden="true" />
          Reintentar
        </Button>
      </div>
    );

  if (!roles.data)
    return (
      <div role="status" aria-label="Cargando roles" className="flex flex-col">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="flex flex-col gap-2 border-t px-5 py-4 first:border-t-0"
          >
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    );

  return (
    <ul aria-label="Roles" className="flex flex-col">
      {roles.data.map((role) => {
        const open = isOpen(role.id, pathname);
        return (
          <li
            key={role.id}
            className={cn(
              'flex flex-col gap-1.5 border-t px-5 py-4 first:border-t-0',
              open &&
                'bg-orange-500/8 shadow-[inset_3px_0_0] shadow-orange-500',
            )}
          >
            <Link
              href={`/roles/${role.id}`}
              aria-current={open ? 'page' : undefined}
              className="flex min-h-11 flex-col justify-center gap-1 rounded-sm"
            >
              <span className="flex flex-wrap items-center gap-2 font-semibold">
                {role.name}
                {role.is_protected && (
                  <span className="rounded-full border px-2 font-mono text-[0.5625rem] font-normal tracking-[0.12em] text-muted-foreground uppercase">
                    Protegido
                  </span>
                )}
              </span>
              {role.description && (
                <span className="text-[0.78125rem] leading-snug text-muted-foreground">
                  {role.description}
                </span>
              )}
            </Link>
            <RoleCount role={role} />
          </li>
        );
      })}
    </ul>
  );
}

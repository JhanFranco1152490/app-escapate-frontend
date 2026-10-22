'use client';

import { cn } from 'cn';
import { Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { ButtonLink } from '@/components/button-link';
import { PageHeader } from '@/components/page-header';
import { useHasPermission } from '@/features/auth/permissions';

import { RolesList } from './roles-list';

// En escritorio, la lista de roles queda a la izquierda y el rol abierto a la derecha. En
// celular son pantallas separadas: la lista en /roles y el rol en su propia ruta. En /roles
// la columna derecha no se oculta en celular, sino que sube arriba de la lista: ahí aparece el
// aviso de la última acción (por ejemplo, "Rol borrado.").
export function RolesLayout({ children }: { children: ReactNode }) {
  const canManage = useHasPermission('roles.manage');
  const onIndex = usePathname() === '/roles';

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Administración / 03"
        title="Roles y permisos"
        description="Define qué puede hacer cada rol. Los cambios se aplican a todas las personas que lo tienen."
        actions={
          canManage && (
            <ButtonLink href="/roles/nuevo">
              <Plus aria-hidden="true" />
              Nuevo rol
            </ButtonLink>
          )
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <nav
          aria-label="Lista de roles"
          className={cn(
            'overflow-hidden rounded-md border bg-card',
            !onIndex && 'max-lg:hidden',
          )}
        >
          <RolesList />
        </nav>
        <div className={cn('min-w-0', onIndex && 'max-lg:order-first')}>
          {children}
        </div>
      </div>
    </div>
  );
}

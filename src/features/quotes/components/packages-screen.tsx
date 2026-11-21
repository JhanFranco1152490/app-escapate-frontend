'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { SearchInput } from '@/components/search-input';
import { StatusBadge } from '@/components/status-badge';
import { TableSkeleton } from '@/components/table-skeleton';
import { Button } from '@/components/ui/button';
import { useHasPermission } from '@/features/auth/permissions';

import { useCreatePackage, usePackages } from '../package-api';
import { PackageGeneralForm } from './package-general-form';

export function PackagesScreen() {
  const router = useRouter();
  const canManage = useHasPermission('quotes.manage');
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const packages = usePackages({ q: q.trim(), active: null, page: 1 });
  const create = useCreatePackage();

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Oferta turística / 04"
        title="Paquetes turísticos"
        description="Combinaciones de servicios listas para cotizar, con sus precios de referencia."
        actions={
          canManage &&
          !creating && (
            <Button onClick={() => setCreating(true)}>
              <Plus aria-hidden="true" />
              Nuevo paquete
            </Button>
          )
        }
      />
      {creating && (
        <section className="rounded-md border bg-card px-5 py-5">
          <h2 className="mb-4 font-heading text-lg font-semibold">
            Nuevo paquete
          </h2>
          <PackageGeneralForm
            submitLabel="Crear paquete"
            pending={create.isPending}
            onCancel={() => setCreating(false)}
            onSubmit={async (body) => {
              const created = await create.mutateAsync(body);
              router.push(`/paquetes/${created.id}`);
            }}
          />
        </section>
      )}
      <SearchInput
        label="Buscar paquete"
        placeholder="Nombre o destino"
        maxLength={100}
        value={q}
        onValueChange={setQ}
      />
      {!packages.data ? (
        <TableSkeleton label="Cargando paquetes" />
      ) : packages.data.results.length === 0 ? (
        <EmptyState title="Aún no hay paquetes">
          Crea un paquete con los servicios que más se venden para cotizarlo en
          un clic.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.data.results.map((item) => (
            <li key={item.id}>
              <Link
                href={`/paquetes/${item.id}`}
                className="flex h-full flex-col gap-2 rounded-md border bg-card px-5 py-4 hover:bg-muted/40"
              >
                <span className="font-mono text-[0.625rem] tracking-[0.16em] text-orange-600 uppercase">
                  {item.code} · {item.destination}
                </span>
                <span className="font-heading text-base font-semibold">
                  {item.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {item.nights} noches · precios para {item.reference_travelers}{' '}
                  personas
                </span>
                <StatusBadge
                  label={item.is_active ? 'Activo' : 'Inactivo'}
                  tone={item.is_active ? 'ok' : 'inactive'}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

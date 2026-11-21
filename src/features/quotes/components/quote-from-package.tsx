'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Alert } from '@/components/alert';
import { Button } from '@/components/ui/button';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { actionErrorMessage } from '@/lib/action-feedback';
import { setPageNotice } from '@/lib/page-notice';

import { quoteNoticeTarget } from '../format';
import { usePackages, useQuoteFromPackage } from '../package-api';

// Cotizar la solicitud a partir de un paquete activo: copia sus servicios y precios a una
// cotización nueva, sin cambiar el paquete.
export function QuoteFromPackage({ requestId }: { requestId: number }) {
  const router = useRouter();
  const packages = usePackages({ q: '', active: true, page: 1 });
  const fromPackage = useQuoteFromPackage();
  const [packageId, setPackageId] = useState('');
  const options = packages.data?.results ?? [];
  if (options.length === 0) return null;

  const run = () =>
    fromPackage.mutate(
      { travel_request_id: requestId, package_id: Number(packageId) },
      {
        onSuccess: (quote) => {
          setPageNotice({
            target: quoteNoticeTarget(quote.id),
            text: 'Cotización creada desde el paquete. Ajusta fechas y precios si hace falta.',
          });
          router.push(`/cotizaciones/${quote.id}`);
        },
      },
    );

  return (
    <div className="flex flex-col gap-2 border-t px-5 py-4">
      {fromPackage.isError && (
        <Alert title={actionErrorMessage(fromPackage.error)} />
      )}
      <div className="flex flex-wrap items-center gap-3">
        <NativeSelect
          aria-label="Paquete para cotizar"
          value={packageId}
          onChange={(event) => setPackageId(event.target.value)}
        >
          <NativeSelectOption value="">Elige un paquete…</NativeSelectOption>
          {options.map((item) => (
            <NativeSelectOption key={item.id} value={String(item.id)}>
              {item.name} · {item.destination}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Button
          variant="outline"
          disabled={!packageId || fromPackage.isPending}
          onClick={run}
        >
          Cotizar desde el paquete
        </Button>
      </div>
    </div>
  );
}

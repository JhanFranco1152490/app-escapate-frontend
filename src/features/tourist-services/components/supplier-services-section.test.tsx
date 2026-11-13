import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { buildPage } from '@/test/clients';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';
import { buildSupplierDetail } from '@/test/suppliers';
import { buildServiceListItem } from '@/test/tourist-services';

import { SupplierServicesSection } from './supplier-services-section';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

const MANAGER = [
  'suppliers.view',
  'tourist_services.view',
  'tourist_services.manage',
];

const SERVICES = buildPage([
  buildServiceListItem(),
  buildServiceListItem({
    id: 61,
    service_type: 'tours',
    name: 'Tour Islas del Rosario',
    current_rate_count: 1,
  }),
  buildServiceListItem({
    id: 62,
    name: 'Habitación sencilla',
    current_rate_count: 0,
    is_active: false,
  }),
]);

let requests = 0;
let page = SERVICES;

beforeEach(() => {
  requests = 0;
  page = SERVICES;
  server.use(
    http.get(apiUrl('/api/suppliers/40/tourist-services'), () => {
      requests += 1;
      return HttpResponse.json(page);
    }),
  );
});

const renderSection = async ({
  permissions = MANAGER,
  supplier = buildSupplierDetail(),
} = {}) => {
  server.use(sessionHandler(buildSession({ permissions })));
  renderWithProviders(
    <SessionGuard>
      <h1>Ficha</h1>
      <SupplierServicesSection supplier={supplier} />
    </SessionGuard>,
  );
  await screen.findByRole('heading', { name: 'Ficha' });
};

describe('SupplierServicesSection', () => {
  it('lista los servicios con su tipo, destino, tarifas vigentes y estado', async () => {
    await renderSection();

    const rowOf = async (name: string) =>
      within((await screen.findByRole('link', { name })).closest('li')!);
    const room = await rowOf('Habitación familiar conectada');
    expect(room.getByText('Alojamiento')).toBeVisible();
    expect(room.getByText('Cartagena')).toBeVisible();
    expect(room.getByText('2 tarifas vigentes')).toBeVisible();
    expect(room.getByText('Activo')).toBeVisible();
    expect(
      (await rowOf('Tour Islas del Rosario')).getByText('1 tarifa vigente'),
    ).toBeVisible();
    const single = await rowOf('Habitación sencilla');
    expect(single.getByText('Sin tarifas vigentes')).toBeVisible();
    expect(single.getByText('Inactivo')).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Tour Islas del Rosario' }),
    ).toHaveAttribute('href', '/servicios/61');
    expect(
      screen.getByRole('link', { name: /Nuevo servicio/ }),
    ).toHaveAttribute('href', '/proveedores/40/servicios/nuevo');
  });

  it('sin servicios lo dice y ofrece registrar el primero', async () => {
    page = buildPage([]);
    await renderSection();

    expect(
      await screen.findByText(
        'Este proveedor aún no tiene servicios registrados.',
      ),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: /Nuevo servicio/ })).toBeVisible();
  });

  it('con el proveedor inactivo no ofrece servicios nuevos y explica por qué', async () => {
    await renderSection({
      supplier: buildSupplierDetail({ is_active: false }),
    });

    expect(
      await screen.findByText(
        'Activa el proveedor para registrarle servicios nuevos.',
      ),
    ).toBeVisible();
    expect(screen.queryByRole('link', { name: /Nuevo servicio/ })).toBeNull();
  });

  it('solo con "Ver" muestra la lista sin "Nuevo servicio"', async () => {
    await renderSection({
      permissions: ['suppliers.view', 'tourist_services.view'],
    });

    expect(
      await screen.findByRole('link', {
        name: 'Habitación familiar conectada',
      }),
    ).toBeVisible();
    expect(screen.queryByRole('link', { name: /Nuevo servicio/ })).toBeNull();
  });

  it('sin permiso para ver servicios no aparece ni los pide', async () => {
    await renderSection({ permissions: ['suppliers.view'] });

    expect(
      screen.queryByRole('heading', { name: 'Servicios' }),
    ).not.toBeInTheDocument();
    expect(requests).toBe(0);
  });
});

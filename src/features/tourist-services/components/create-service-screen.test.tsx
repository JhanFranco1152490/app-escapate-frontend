import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { clearPageNotice, readPageNotice } from '@/lib/page-notice';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';
import { buildSupplierDetail } from '@/test/suppliers';
import { buildServiceDetail } from '@/test/tourist-services';

import { CreateServiceScreen } from './create-service-screen';

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const SUPPLIER_INACTIVE =
  'El proveedor está inactivo. Actívalo antes de registrarle servicios o activar uno de ellos.';

let supplier = buildSupplierDetail();
let created: Record<string, unknown>[] = [];

beforeEach(() => {
  router.push.mockReset();
  supplier = buildSupplierDetail();
  created = [];
  server.use(
    sessionHandler(
      buildSession({
        permissions: [
          'suppliers.view',
          'tourist_services.view',
          'tourist_services.manage',
        ],
      }),
    ),
    http.get(apiUrl('/api/suppliers/40'), () => HttpResponse.json(supplier)),
    http.post(
      apiUrl('/api/suppliers/40/tourist-services'),
      async ({ request }) => {
        created.push((await request.json()) as Record<string, unknown>);
        return HttpResponse.json(buildServiceDetail({ id: 61 }), {
          status: 201,
        });
      },
    ),
  );
});

afterEach(() => {
  clearPageNotice();
});

const renderScreen = (id = '40') =>
  renderWithProviders(
    <SessionGuard>
      <CreateServiceScreen supplierId={id} />
    </SessionGuard>,
  );

async function fillLodging() {
  const user = userEvent.setup();
  await screen.findByRole('heading', { name: 'Nuevo servicio' });
  await user.click(screen.getByRole('radio', { name: 'Alojamiento' }));
  await user.click(screen.getByLabelText(/Nombre del servicio/));
  await user.paste('Habitación familiar conectada');
  await user.click(screen.getByLabelText(/Destino/));
  await user.paste('Cartagena');
  await user.selectOptions(
    screen.getByLabelText(/Tipo de alojamiento/),
    'Hotel',
  );
  await user.click(screen.getByLabelText(/Capacidad máxima/));
  await user.paste('4');
  return user;
}

const save = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Guardar servicio' }));

describe('CreateServiceScreen', () => {
  it('registra el servicio del proveedor y lleva a su ficha con un aviso', async () => {
    renderScreen();
    expect(await screen.findByText('Hotel Costa Azul')).toBeVisible();
    const user = await fillLodging();

    await save(user);

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith('/servicios/61'),
    );
    expect(created[0]).toMatchObject({
      service_type: 'lodging',
      name: 'Habitación familiar conectada',
      attributes: { lodging_kind: 'hotel', max_capacity: 4 },
    });
    expect(readPageNotice('tourist-service:61')).toBe('Servicio registrado.');
  });

  it('cancelar vuelve a la ficha del proveedor', async () => {
    renderScreen();

    expect(
      await screen.findByRole('link', { name: 'Cancelar' }),
    ).toHaveAttribute('href', '/proveedores/40');
  });

  it('con el proveedor inactivo no muestra el formulario', async () => {
    supplier = buildSupplierDetail({ is_active: false });
    renderScreen();

    expect(
      await screen.findByText(
        'Activa el proveedor para registrarle servicios nuevos.',
      ),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Guardar servicio' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Ir a la ficha del proveedor' }),
    ).toHaveAttribute('href', '/proveedores/40');
  });

  it('si lo desactivaron mientras se escribía, lo dice sin borrar lo escrito', async () => {
    server.use(
      http.post(apiUrl('/api/suppliers/40/tourist-services'), () =>
        HttpResponse.json(
          { detail: SUPPLIER_INACTIVE, code: 'supplier_inactive', fields: {} },
          { status: 409 },
        ),
      ),
    );
    renderScreen();
    const user = await fillLodging();

    await save(user);

    expect(await screen.findByText(SUPPLIER_INACTIVE)).toBeVisible();
    expect(screen.getByLabelText(/Nombre del servicio/)).toHaveValue(
      'Habitación familiar conectada',
    );
    expect(router.push).not.toHaveBeenCalled();
  });

  it('un proveedor que no existe muestra "No encontramos este proveedor"', async () => {
    server.use(
      http.get(apiUrl('/api/suppliers/99'), () =>
        HttpResponse.json(
          { detail: 'No encontrado.', code: 'not_found', fields: {} },
          { status: 404 },
        ),
      ),
    );
    renderScreen('99');

    expect(
      await screen.findByText('No encontramos este proveedor'),
    ).toBeVisible();
  });
});

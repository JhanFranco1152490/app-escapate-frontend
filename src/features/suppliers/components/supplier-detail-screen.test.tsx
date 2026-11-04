import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { clearPageNotice, setPageNotice } from '@/lib/page-notice';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';
import { buildSupplierDetail } from '@/test/suppliers';

import { SupplierDetailScreen } from './supplier-detail-screen';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

let current = buildSupplierDetail();
let changes: { action: string; body: unknown }[] = [];

const STALE_MESSAGE =
  'Alguien más guardó cambios. Recarga para ver la versión actual.';

const serveStatusChange = (action: 'deactivate' | 'activate') =>
  http.post(apiUrl(`/api/suppliers/40/${action}`), async ({ request }) => {
    changes.push({ action, body: await request.json() });
    const active = action === 'activate';
    current = buildSupplierDetail({
      is_active: active,
      deactivated_at: active ? null : '2026-11-02T15:00:00Z',
      deactivated_by: active ? null : { id: 3, full_name: 'Sofía Barrios' },
      version: current.version + 1,
    });
    return HttpResponse.json(current);
  });

beforeEach(() => {
  current = buildSupplierDetail();
  changes = [];
  server.use(
    http.get(apiUrl('/api/suppliers/40'), () => HttpResponse.json(current)),
    serveStatusChange('deactivate'),
    serveStatusChange('activate'),
  );
});

afterEach(() => {
  clearPageNotice();
});

const renderScreen = (permissions = ['suppliers.view', 'suppliers.manage']) => {
  server.use(sessionHandler(buildSession({ permissions })));
  renderWithProviders(
    <SessionGuard>
      <SupplierDetailScreen id="40" />
    </SessionGuard>,
  );
  return screen.findByRole('heading', { name: 'Hotel Costa Azul' });
};

describe('SupplierDetailScreen', () => {
  it('muestra la identificación, el contacto y la información comercial', async () => {
    await renderScreen();

    expect(screen.getByText('NIT 800.111.222-7')).toBeVisible();
    expect(screen.getByText('Costa Azul S.A.S.')).toBeVisible();
    expect(screen.getByText('Alojamiento')).toBeVisible();
    expect(screen.getByText('Tours y actividades')).toBeVisible();
    expect(screen.getByText('Caribe colombiano')).toBeVisible();
    expect(screen.getByText('Mónica Salas')).toBeVisible();
    expect(screen.getByRole('link', { name: '300 111 2233' })).toHaveAttribute(
      'href',
      'tel:+573001112233',
    );
    expect(
      screen.getByRole('link', { name: 'ventas@example.com' }),
    ).toHaveAttribute('href', 'mailto:ventas@example.com');
    expect(
      screen.getByText('50 % al reservar, saldo 15 días antes'),
    ).toBeVisible();
    expect(screen.getByText('10 %')).toBeVisible();
    expect(screen.getByText(/Por Sofía Barrios el/)).toBeVisible();
    expect(screen.queryByText('Convenio vencido')).not.toBeInTheDocument();
  });

  it('los datos que faltan se muestran como "Sin registrar"', async () => {
    current = buildSupplierDetail({
      legal_name: null,
      document_type: null,
      document_number: null,
      contact_phone: null,
      commission_rate: null,
      agreement_valid_until: null,
    });
    await renderScreen();

    expect(screen.getByText('Sin documento')).toBeVisible();
    expect(screen.getAllByText('Sin registrar').length).toBeGreaterThanOrEqual(
      4,
    );
  });

  it('avisa "Convenio vencido" cuando la vigencia ya pasó', async () => {
    current = buildSupplierDetail({
      agreement_valid_until: '2026-01-31',
      agreement_expired: true,
    });
    await renderScreen();

    expect(screen.getByText('Convenio vencido')).toBeVisible();
  });

  it('muestra el aviso que dejó el formulario', async () => {
    setPageNotice({ target: 'supplier:40', text: 'Proveedor registrado.' });
    await renderScreen();

    expect(await screen.findByText('Proveedor registrado.')).toBeVisible();
  });

  it('un proveedor inactivo lo indica y ofrece activarlo', async () => {
    current = buildSupplierDetail({
      is_active: false,
      deactivated_at: '2026-11-02T15:00:00Z',
      deactivated_by: { id: 3, full_name: 'Sofía Barrios' },
    });
    await renderScreen();

    expect(
      screen.getByText('Proveedor inactivo desde el 2 de noviembre de 2026'),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Desactivar' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Activar' })).toBeVisible();
  });

  it('desactivar pide confirmación y envía la versión', async () => {
    await renderScreen();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Desactivar' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(
      within(dialog).getByText(/dejará de aparecer al registrar servicios/),
    ).toBeVisible();
    expect(changes).toHaveLength(0);
    await user.click(
      within(dialog).getByRole('button', { name: 'Desactivar' }),
    );

    expect(await screen.findByText('Proveedor desactivado.')).toBeVisible();
    expect(changes).toEqual([
      { action: 'deactivate', body: { expected_version: 1 } },
    ]);
    expect(
      await screen.findByText(/Proveedor inactivo desde el/),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Activar' })).toBeVisible();
  });

  it('cancelar la confirmación no cambia nada', async () => {
    await renderScreen();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Desactivar' }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Cancelar',
      }),
    );

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(changes).toHaveLength(0);
  });

  it('si la ficha cambió, el diálogo muestra el motivo y sigue abierto', async () => {
    server.use(
      http.post(apiUrl('/api/suppliers/40/deactivate'), () =>
        HttpResponse.json(
          { detail: STALE_MESSAGE, code: 'stale_version', fields: {} },
          { status: 409 },
        ),
      ),
    );
    await renderScreen();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Desactivar' }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(
      within(dialog).getByRole('button', { name: 'Desactivar' }),
    );

    expect(await within(dialog).findByText(STALE_MESSAGE)).toBeVisible();
  });

  it('activar no pide confirmación y envía la versión', async () => {
    current = buildSupplierDetail({
      is_active: false,
      deactivated_at: '2026-11-02T15:00:00Z',
      deactivated_by: { id: 3, full_name: 'Sofía Barrios' },
      version: 3,
    });
    await renderScreen();

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Activar' }));

    expect(await screen.findByText('Proveedor activado.')).toBeVisible();
    expect(changes).toEqual([
      { action: 'activate', body: { expected_version: 3 } },
    ]);
    expect(
      screen.queryByText(/Proveedor inactivo desde el/),
    ).not.toBeInTheDocument();
  });

  it('si activar falla, muestra el motivo', async () => {
    current = buildSupplierDetail({
      is_active: false,
      deactivated_at: '2026-11-02T15:00:00Z',
      deactivated_by: { id: 3, full_name: 'Sofía Barrios' },
    });
    server.use(
      http.post(apiUrl('/api/suppliers/40/activate'), () =>
        HttpResponse.json(
          { detail: STALE_MESSAGE, code: 'stale_version', fields: {} },
          { status: 409 },
        ),
      ),
    );
    await renderScreen();

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Activar' }));

    expect(await screen.findByText(STALE_MESSAGE)).toBeVisible();
  });

  it('con suppliers.manage ofrece editar', async () => {
    await renderScreen();

    expect(screen.getByRole('link', { name: 'Editar datos' })).toHaveAttribute(
      'href',
      '/proveedores/40/editar',
    );
  });

  it('sin suppliers.manage no aparecen los botones', async () => {
    await renderScreen(['suppliers.view']);

    expect(
      screen.queryByRole('link', { name: 'Editar datos' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Desactivar' }),
    ).not.toBeInTheDocument();
  });

  it('un proveedor inexistente muestra "No encontramos este proveedor"', async () => {
    server.use(
      http.get(apiUrl('/api/suppliers/40'), () =>
        HttpResponse.json(
          { detail: 'No encontrado.', code: 'not_found', fields: {} },
          { status: 404 },
        ),
      ),
    );
    server.use(
      sessionHandler(buildSession({ permissions: ['suppliers.view'] })),
    );
    renderWithProviders(
      <SessionGuard>
        <SupplierDetailScreen id="40" />
      </SessionGuard>,
    );

    expect(
      await screen.findByText('No encontramos este proveedor'),
    ).toBeInTheDocument();
  });
});

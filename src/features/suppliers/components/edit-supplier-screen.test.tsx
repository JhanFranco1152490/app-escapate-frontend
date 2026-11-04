import { screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { clearPageNotice, readPageNotice } from '@/lib/page-notice';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';
import { buildSupplierDetail } from '@/test/suppliers';

import { EditSupplierScreen } from './edit-supplier-screen';

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const STALE_MESSAGE =
  'Alguien más guardó cambios. Recarga para ver la versión actual.';

let current = buildSupplierDetail();
let updates: Record<string, unknown>[] = [];

beforeEach(() => {
  router.push.mockReset();
  current = buildSupplierDetail();
  updates = [];
  server.use(
    sessionHandler(
      buildSession({ permissions: ['suppliers.view', 'suppliers.manage'] }),
    ),
    http.get(apiUrl('/api/suppliers/40'), () => HttpResponse.json(current)),
    http.put(apiUrl('/api/suppliers/40'), async ({ request }) => {
      updates.push((await request.json()) as Record<string, unknown>);
      return HttpResponse.json({ ...current, version: current.version + 1 });
    }),
  );
});

afterEach(() => {
  clearPageNotice();
});

const renderScreen = async () => {
  renderWithProviders(
    <SessionGuard>
      <EditSupplierScreen id="40" />
    </SessionGuard>,
  );
  await screen.findByRole('heading', { name: 'Editar proveedor' });
  return userEvent.setup();
};

async function replace(user: UserEvent, label: RegExp, text: string) {
  const field = screen.getByLabelText(label);
  await user.clear(field);
  await user.click(field);
  await user.paste(text);
}

const save = (user: UserEvent) =>
  user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

describe('EditSupplierScreen', () => {
  it('llena el formulario con la ficha', async () => {
    await renderScreen();

    expect(screen.getByLabelText(/Nombre comercial/)).toHaveValue(
      'Hotel Costa Azul',
    );
    expect(screen.getByLabelText('Tipo de documento')).toHaveValue('NIT');
    expect(screen.getByRole('checkbox', { name: 'Alojamiento' })).toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'Tours y actividades' }),
    ).toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'Cruceros' }),
    ).not.toBeChecked();
    expect(screen.getByLabelText(/Teléfono/)).toHaveValue('3001112233');
    expect(screen.getByLabelText(/Comisión acordada/)).toHaveValue('10.00');
    expect(screen.getByLabelText(/Vigencia del convenio/)).toHaveValue(
      '2027-06-30',
    );
  });

  it('guarda con la versión con que se abrió y vuelve a la ficha con un aviso', async () => {
    const user = await renderScreen();
    await replace(user, /Ciudad/, 'Bogotá');

    await save(user);

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith('/proveedores/40'),
    );
    expect(updates[0]).toMatchObject({
      trade_name: 'Hotel Costa Azul',
      city: 'Bogotá',
      contact_phone: '+573001112233',
      expected_version: 1,
    });
    expect(readPageNotice('supplier:40')).toBe('Cambios guardados.');
  });

  it('un proveedor sin teléfono se abre con el campo vacío', async () => {
    current = buildSupplierDetail({ contact_phone: null });
    await renderScreen();

    expect(screen.getByLabelText(/Teléfono/)).toHaveValue('');
  });

  it('si otra persona guardó antes, avisa sin borrar lo escrito y recargar trae lo nuevo', async () => {
    server.use(
      http.put(apiUrl('/api/suppliers/40'), () =>
        HttpResponse.json(
          { detail: STALE_MESSAGE, code: 'stale_version', fields: {} },
          { status: 409 },
        ),
      ),
    );
    const user = await renderScreen();
    await replace(user, /Ciudad/, 'Bogotá');

    await save(user);

    expect(await screen.findByText(STALE_MESSAGE)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ciudad/)).toHaveValue('Bogotá');
    expect(router.push).not.toHaveBeenCalled();

    current = buildSupplierDetail({ city: 'Pamplona', version: 2 });
    await user.click(screen.getByRole('button', { name: 'Recargar' }));

    await waitFor(() =>
      expect(screen.getByLabelText(/Ciudad/)).toHaveValue('Pamplona'),
    );
    expect(screen.queryByText(STALE_MESSAGE)).not.toBeInTheDocument();
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
    renderWithProviders(
      <SessionGuard>
        <EditSupplierScreen id="40" />
      </SessionGuard>,
    );

    expect(
      await screen.findByText('No encontramos este proveedor'),
    ).toBeInTheDocument();
  });
});

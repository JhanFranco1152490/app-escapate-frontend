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
import { buildServiceDetail } from '@/test/tourist-services';

import { EditServiceScreen } from './edit-service-screen';

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const STALE_MESSAGE =
  'Alguien más guardó cambios. Recarga para ver la versión actual.';

let current = buildServiceDetail();
let updates: Record<string, unknown>[] = [];

beforeEach(() => {
  router.push.mockReset();
  current = buildServiceDetail();
  updates = [];
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
    http.get(apiUrl('/api/tourist-services/60'), () =>
      HttpResponse.json(current),
    ),
    http.put(apiUrl('/api/tourist-services/60'), async ({ request }) => {
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
      <EditServiceScreen id="60" />
    </SessionGuard>,
  );
  await screen.findByRole('heading', { name: 'Editar servicio' });
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

describe('EditServiceScreen', () => {
  it('llena el formulario con la ficha y no deja cambiar el tipo', async () => {
    await renderScreen();

    expect(screen.getByText('Hotel Costa Azul')).toBeVisible();
    expect(screen.getByRole('radio', { name: 'Alojamiento' })).toBeDisabled();
    expect(screen.getByLabelText(/Nombre del servicio/)).toHaveValue(
      'Habitación familiar conectada',
    );
    expect(screen.getByLabelText(/Capacidad máxima/)).toHaveValue('4');
    expect(
      screen.getByRole('link', { name: /Volver al servicio/ }),
    ).toHaveAttribute('href', '/servicios/60');
  });

  it('guarda con el tipo actual y la versión con que se abrió (CA-05)', async () => {
    const user = await renderScreen();
    await replace(user, /Capacidad máxima/, '6');

    await save(user);

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith('/servicios/60'),
    );
    expect(updates[0]).toMatchObject({
      service_type: 'lodging',
      expected_version: 1,
      attributes: { max_capacity: 6, lodging_kind: 'hotel' },
    });
    expect(readPageNotice('tourist-service:60')).toBe('Cambios guardados.');
  });

  it('si otra persona guardó antes, avisa sin borrar lo escrito y recargar trae lo nuevo', async () => {
    server.use(
      http.put(apiUrl('/api/tourist-services/60'), () =>
        HttpResponse.json(
          { detail: STALE_MESSAGE, code: 'stale_version', fields: {} },
          { status: 409 },
        ),
      ),
    );
    const user = await renderScreen();
    await replace(user, /Capacidad máxima/, '6');

    await save(user);

    expect(await screen.findByText(STALE_MESSAGE)).toBeVisible();
    expect(screen.getByLabelText(/Capacidad máxima/)).toHaveValue('6');
    expect(router.push).not.toHaveBeenCalled();

    current = buildServiceDetail({
      attributes: { lodging_kind: 'resort', max_capacity: 8, includes: [] },
      version: 2,
    });
    await user.click(screen.getByRole('button', { name: 'Recargar' }));

    await waitFor(() =>
      expect(screen.getByLabelText(/Capacidad máxima/)).toHaveValue('8'),
    );
    expect(screen.queryByText(STALE_MESSAGE)).not.toBeInTheDocument();
  });

  it('un servicio inactivo también se edita', async () => {
    current = buildServiceDetail({
      is_active: false,
      deactivated_at: '2026-11-10T15:00:00Z',
    });
    const user = await renderScreen();

    await save(user);

    await waitFor(() => expect(updates).toHaveLength(1));
  });
});

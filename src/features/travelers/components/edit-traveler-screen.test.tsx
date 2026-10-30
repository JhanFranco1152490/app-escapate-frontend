import { screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { clearPageNotice, readPageNotice } from '@/lib/page-notice';
import { buildTravelerDetail } from '@/test/clients';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { EditTravelerScreen } from './edit-traveler-screen';

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const STALE_MESSAGE =
  'Alguien más guardó cambios. Recarga para ver la versión actual.';

let current = buildTravelerDetail();
let updates: Record<string, unknown>[] = [];

beforeEach(() => {
  router.push.mockReset();
  current = buildTravelerDetail();
  updates = [];
  server.use(
    sessionHandler(
      buildSession({
        permissions: ['clients.view', 'travelers.view', 'travelers.manage'],
      }),
    ),
    http.get(apiUrl('/api/travelers/30'), () => HttpResponse.json(current)),
    http.put(apiUrl('/api/travelers/30'), async ({ request }) => {
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
      <EditTravelerScreen id="30" />
    </SessionGuard>,
  );
  await screen.findByRole('heading', { name: 'Editar viajero' });
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

describe('EditTravelerScreen', () => {
  it('llena el formulario con la ficha y no pide la autorización', async () => {
    await renderScreen();

    expect(screen.getByLabelText(/^Nombres/)).toHaveValue('Sofía');
    expect(screen.getByLabelText(/Tipo de documento/)).toHaveValue('TI');
    expect(screen.getByText('Marcela Gómez Ortiz')).toBeInTheDocument();
    expect(
      screen.queryByRole('checkbox', { name: /autorización/ }),
    ).not.toBeInTheDocument();
  });

  it('guarda con la versión con que se abrió y vuelve a la ficha con un aviso', async () => {
    const user = await renderScreen();
    await replace(user, /Observaciones/, 'Prefiere ventana.');

    await save(user);

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith('/viajeros/30'),
    );
    expect(updates[0]).toMatchObject({
      first_name: 'Sofía',
      reference_client_id: 12,
      notes: 'Prefiere ventana.',
      expected_version: 1,
    });
    expect(updates[0]).not.toHaveProperty('data_consent');
    expect(readPageNotice('traveler:30')).toBe('Cambios guardados.');
  });

  it('se puede quitar el cliente de referencia', async () => {
    const user = await renderScreen();

    await user.click(screen.getByRole('button', { name: 'Quitar' }));
    await save(user);

    await waitFor(() => expect(updates).toHaveLength(1));
    expect(updates[0]).toMatchObject({
      reference_client_id: null,
      is_the_client: false,
    });
  });

  it('si otra persona guardó antes, avisa sin borrar lo escrito', async () => {
    server.use(
      http.put(apiUrl('/api/travelers/30'), () =>
        HttpResponse.json(
          { detail: STALE_MESSAGE, code: 'stale_version', fields: {} },
          { status: 409 },
        ),
      ),
    );
    const user = await renderScreen();
    await replace(user, /Observaciones/, 'Prefiere ventana.');

    await save(user);

    expect(await screen.findByText(STALE_MESSAGE)).toBeInTheDocument();
    expect(screen.getByLabelText(/Observaciones/)).toHaveValue(
      'Prefiere ventana.',
    );
    expect(router.push).not.toHaveBeenCalled();

    current = buildTravelerDetail({ notes: 'Pasillo.', version: 2 });
    await user.click(screen.getByRole('button', { name: 'Recargar' }));

    await waitFor(() =>
      expect(screen.getByLabelText(/Observaciones/)).toHaveValue('Pasillo.'),
    );
  });
});

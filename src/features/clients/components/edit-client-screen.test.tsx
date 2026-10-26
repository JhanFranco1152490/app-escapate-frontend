import { screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { clearPageNotice, readPageNotice } from '@/lib/page-notice';
import { buildClientDetail } from '@/test/clients';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { EditClientScreen } from './edit-client-screen';

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const STALE_MESSAGE =
  'Alguien más guardó cambios. Recarga para ver la versión actual.';

let current = buildClientDetail();
let updates: Record<string, unknown>[] = [];

beforeEach(() => {
  router.push.mockReset();
  current = buildClientDetail();
  updates = [];
  server.use(
    sessionHandler(
      buildSession({ permissions: ['clients.view', 'clients.manage'] }),
    ),
    http.get(apiUrl('/api/clients/12'), () => HttpResponse.json(current)),
    http.put(apiUrl('/api/clients/12'), async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      updates.push(body);
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
      <EditClientScreen id="12" />
    </SessionGuard>,
  );
  await screen.findByRole('heading', { name: 'Editar cliente' });
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

describe('EditClientScreen', () => {
  it('llena el formulario con la ficha y no deja cambiar el tipo', async () => {
    await renderScreen();

    expect(screen.getByRole('textbox', { name: /Nombres/ })).toHaveValue(
      'Marcela',
    );
    expect(screen.getByRole('radio', { name: 'Empresa' })).toBeDisabled();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('guarda con la versión con que se abrió y vuelve a la ficha con un aviso', async () => {
    const user = await renderScreen();
    await replace(user, /Ciudad/, 'Bogotá');

    await save(user);

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith('/clientes/12'),
    );
    expect(updates[0]).toMatchObject({
      client_type: 'person',
      city: 'Bogotá',
      phone: '+573001112233',
      expected_version: 1,
    });
    expect(updates[0]).not.toHaveProperty('data_consent');
    expect(readPageNotice('client:12')).toBe('Cambios guardados.');
  });

  it('si otra persona guardó antes, avisa sin borrar lo escrito y recargar trae lo nuevo', async () => {
    server.use(
      http.put(apiUrl('/api/clients/12'), () =>
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
    expect(screen.getByRole('combobox', { name: /Ciudad/ })).toHaveValue(
      'Bogotá',
    );
    expect(router.push).not.toHaveBeenCalled();

    // Lo que guardó la otra persona.
    current = buildClientDetail({ city: 'Pamplona', version: 2 });
    await user.click(screen.getByRole('button', { name: 'Recargar' }));

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /Ciudad/ })).toHaveValue(
        'Pamplona',
      ),
    );
    expect(screen.queryByText(STALE_MESSAGE)).not.toBeInTheDocument();
  });

  it('después de recargar envía la versión nueva', async () => {
    let attempts = 0;
    server.use(
      http.put(apiUrl('/api/clients/12'), async ({ request }) => {
        attempts += 1;
        updates.push((await request.json()) as Record<string, unknown>);
        return attempts === 1
          ? HttpResponse.json(
              { detail: STALE_MESSAGE, code: 'stale_version', fields: {} },
              { status: 409 },
            )
          : HttpResponse.json({ ...current, version: 3 });
      }),
    );
    const user = await renderScreen();
    await save(user);
    await screen.findByText(STALE_MESSAGE);
    current = buildClientDetail({ version: 2 });
    await user.click(screen.getByRole('button', { name: 'Recargar' }));
    await waitFor(() =>
      expect(screen.queryByText(STALE_MESSAGE)).not.toBeInTheDocument(),
    );

    await save(user);

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith('/clientes/12'),
    );
    expect(updates.map((body) => body.expected_version)).toEqual([1, 2]);
  });
});

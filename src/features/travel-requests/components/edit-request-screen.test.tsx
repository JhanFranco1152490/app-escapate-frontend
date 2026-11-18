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
import {
  buildAdvisor,
  buildClosedRequestDetail,
  buildTravelRequestDetail,
} from '@/test/travel-requests';

import { EditRequestScreen } from './edit-request-screen';

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const STALE_MESSAGE =
  'Alguien más guardó cambios. Recarga para ver la versión actual.';
const CLOSED_MESSAGE = 'La solicitud está cerrada. Reábrela para modificarla.';

let current = buildTravelRequestDetail();
let updates: Record<string, unknown>[] = [];

const conflict = (code: string, detail: string) =>
  HttpResponse.json({ code, detail, fields: {} }, { status: 409 });

beforeEach(() => {
  // Solo la fecha: "hoy" queda fijo y los temporizadores siguen siendo reales.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-13T15:00:00Z'));
  router.push.mockReset();
  current = buildTravelRequestDetail();
  updates = [];
  server.use(
    sessionHandler(
      buildSession({
        id: 2,
        permissions: [
          'clients.view',
          'travel_requests.view',
          'travel_requests.manage',
        ],
      }),
    ),
    http.get(apiUrl('/api/travel-requests/231'), () =>
      HttpResponse.json(current),
    ),
    http.get(apiUrl('/api/travel-requests/advisors'), () =>
      HttpResponse.json([
        buildAdvisor({ id: 2, full_name: 'Andrés Peña' }),
        buildAdvisor({ id: 5, full_name: 'Lucía Rangel' }),
      ]),
    ),
    http.put(apiUrl('/api/travel-requests/231'), async ({ request }) => {
      updates.push((await request.json()) as Record<string, unknown>);
      return HttpResponse.json({ ...current, version: current.version + 1 });
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  clearPageNotice();
});

const renderScreen = async () => {
  renderWithProviders(
    <SessionGuard>
      <EditRequestScreen id="231" />
    </SessionGuard>,
  );
  await screen.findByRole('heading', { name: 'Editar solicitud SOL-0231' });
  return userEvent.setup();
};

const waitForForm = () => screen.findByRole('option', { name: 'Lucía Rangel' });

async function replace(user: UserEvent, label: RegExp, text: string) {
  const field = screen.getByLabelText(label);
  await user.clear(field);
  await user.click(field);
  await user.paste(text);
}

const save = (user: UserEvent) =>
  user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

describe('EditRequestScreen', () => {
  it('llena el formulario con la solicitud, y el cliente no se cambia', async () => {
    await renderScreen();
    await waitForForm();

    expect(screen.getByLabelText(/Destino/)).toHaveValue('San Andrés');
    expect(screen.getByLabelText(/Salida/)).toHaveValue('2026-12-18');
    expect(screen.getByLabelText(/Presupuesto mínimo/)).toHaveValue(
      '6.000.000',
    );
    expect(screen.getByRole('checkbox', { name: 'Familiar' })).toBeChecked();
    expect(screen.getByText('Marcela Gómez Ortiz')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Quitar' }),
    ).not.toBeInTheDocument();
  });

  it('guarda con la versión con que se abrió y vuelve a la ficha con un aviso', async () => {
    const user = await renderScreen();
    await waitForForm();
    await replace(user, /Destino/, 'Cartagena');

    await save(user);

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith('/solicitudes/231'),
    );
    expect(updates[0]).toMatchObject({
      client_id: 7,
      destination: 'Cartagena',
      budget_min: 6_000_000,
      trip_types: ['leisure', 'family'],
      expected_version: 1,
    });
    expect(readPageNotice('travel-request:231')).toBe('Cambios guardados.');
  });

  it('quitar un obligatorio no guarda nada', async () => {
    const user = await renderScreen();
    await waitForForm();
    await user.clear(screen.getByLabelText(/Destino/));

    await save(user);

    expect(
      await screen.findByText('Falta 1 campo obligatorio.'),
    ).toBeInTheDocument();
    expect(updates).toEqual([]);
  });

  it('una salida que ya pasó se acepta si no cambió, y no si cambió', async () => {
    current = buildTravelRequestDetail({
      departure_date: '2026-11-01',
      return_date: '2026-11-20',
    });
    const user = await renderScreen();
    await waitForForm();

    await replace(user, /Salida/, '2026-11-02');
    await save(user);
    expect(await screen.findByText('La fecha ya pasó.')).toBeVisible();
    expect(updates).toEqual([]);

    await replace(user, /Salida/, '2026-11-01');
    await save(user);
    await waitFor(() => expect(updates).toHaveLength(1));
    expect(updates[0]).toMatchObject({ departure_date: '2026-11-01' });
  });

  it('si otra persona guardó antes, avisa sin borrar lo escrito y recargar trae lo nuevo', async () => {
    server.use(
      http.put(apiUrl('/api/travel-requests/231'), () =>
        conflict('stale_version', STALE_MESSAGE),
      ),
    );
    const user = await renderScreen();
    await waitForForm();
    await replace(user, /Destino/, 'Cartagena');

    await save(user);

    expect(await screen.findByText(STALE_MESSAGE)).toBeInTheDocument();
    expect(screen.getByLabelText(/Destino/)).toHaveValue('Cartagena');
    expect(router.push).not.toHaveBeenCalled();

    // Lo que guardó la otra persona.
    current = buildTravelRequestDetail({
      destination: 'Santa Marta',
      version: 2,
    });
    await user.click(screen.getByRole('button', { name: 'Recargar' }));

    await waitFor(() =>
      expect(screen.getByLabelText(/Destino/)).toHaveValue('Santa Marta'),
    );
    expect(screen.queryByText(STALE_MESSAGE)).not.toBeInTheDocument();
  });

  it('si la cerraron mientras se editaba, lo dice sin borrar lo escrito', async () => {
    server.use(
      http.put(apiUrl('/api/travel-requests/231'), () =>
        conflict('travel_request_closed', CLOSED_MESSAGE),
      ),
    );
    const user = await renderScreen();
    await waitForForm();
    await replace(user, /Destino/, 'Cartagena');

    await save(user);

    expect(await screen.findByText(CLOSED_MESSAGE)).toBeInTheDocument();
    expect(screen.getByLabelText(/Destino/)).toHaveValue('Cartagena');
    expect(router.push).not.toHaveBeenCalled();
  });

  it('una solicitud cerrada no muestra el formulario', async () => {
    current = buildClosedRequestDetail();
    await renderScreen();

    expect(screen.getByText(CLOSED_MESSAGE)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Ir a la ficha para reabrirla' }),
    ).toHaveAttribute('href', '/solicitudes/231');
    expect(
      screen.queryByRole('button', { name: 'Guardar cambios' }),
    ).not.toBeInTheDocument();
  });
});

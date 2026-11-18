import { screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { clearPageNotice, readPageNotice } from '@/lib/page-notice';
import {
  buildClientDetail,
  buildClientListItem,
  buildPage,
} from '@/test/clients';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';
import { buildAdvisor, buildTravelRequestDetail } from '@/test/travel-requests';

import { CreateRequestScreen } from './create-request-screen';

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const ALL = [
  'clients.view',
  'clients.manage',
  'travel_requests.view',
  'travel_requests.manage',
];

let created: Record<string, unknown>[] = [];

beforeEach(() => {
  // Solo la fecha: "hoy" queda fijo y los temporizadores siguen siendo reales.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-13T15:00:00Z'));
  router.push.mockReset();
  created = [];
  server.use(
    http.get(apiUrl('/api/clients/7'), () =>
      HttpResponse.json(
        buildClientDetail({ id: 7, display_name: 'Marcela Gómez Ortiz' }),
      ),
    ),
    http.get(apiUrl('/api/clients'), () =>
      HttpResponse.json(
        buildPage([
          buildClientListItem({ id: 7, display_name: 'Marcela Gómez Ortiz' }),
        ]),
      ),
    ),
    http.get(apiUrl('/api/travel-requests/advisors'), () =>
      HttpResponse.json([
        buildAdvisor({ id: 2, full_name: 'Andrés Peña' }),
        buildAdvisor({ id: 5, full_name: 'Lucía Rangel' }),
      ]),
    ),
    http.post(apiUrl('/api/travel-requests'), async ({ request }) => {
      created.push((await request.json()) as Record<string, unknown>);
      return HttpResponse.json(buildTravelRequestDetail({ id: 231 }), {
        status: 201,
      });
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  clearPageNotice();
});

const renderScreen = async ({
  searchParams = '',
  permissions = ALL,
}: { searchParams?: string; permissions?: string[] } = {}) => {
  server.use(sessionHandler(buildSession({ id: 2, permissions })));
  renderWithProviders(
    <SessionGuard>
      <CreateRequestScreen />
    </SessionGuard>,
    { searchParams },
  );
  await screen.findByRole('heading', { name: 'Nueva solicitud' });
  await screen.findByRole('option', { name: 'Lucía Rangel' });
  return userEvent.setup();
};

// Pega el texto en vez de escribirlo tecla por tecla: el formulario recibe los mismos eventos
// y la prueba no depende de lo rápida que esté la máquina.
async function fill(user: UserEvent, label: RegExp, text: string) {
  await user.click(screen.getByLabelText(label));
  await user.paste(text);
}

const submit = (user: UserEvent) =>
  user.click(screen.getByRole('button', { name: 'Guardar solicitud' }));

describe('CreateRequestScreen', () => {
  it('registra una solicitud con fechas exactas y lleva a su ficha con un aviso', async () => {
    const user = await renderScreen({ searchParams: '?client_id=7' });
    expect(await screen.findByText('Marcela Gómez Ortiz')).toBeInTheDocument();
    // Quien está en la sesión es el responsable, salvo que se elija otro.
    expect(screen.getByLabelText(/Asesor responsable/)).toHaveValue('2');
    await fill(user, /Destino/, 'San Andrés');
    await fill(user, /Salida/, '2026-12-18');
    await user.click(screen.getByRole('checkbox', { name: 'Familiar' }));

    await submit(user);

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith('/solicitudes/231'),
    );
    expect(created).toEqual([
      expect.objectContaining({
        client_id: 7,
        destination: 'San Andrés',
        date_mode: 'exact',
        departure_date: '2026-12-18',
        trip_types: ['family'],
        assigned_to_id: 2,
      }),
    ]);
    expect(readPageNotice('travel-request:231')).toBe('Solicitud registrada.');
  });

  it('registra una solicitud con período flexible eligiendo el cliente', async () => {
    const user = await renderScreen();
    await fill(user, /Buscar cliente/, 'Marcela');
    await user.click(
      await screen.findByRole('button', { name: /Marcela Gómez Ortiz/ }),
    );
    await fill(user, /Destino/, 'Cartagena');
    await user.click(screen.getByRole('radio', { name: 'Período flexible' }));
    await fill(user, /Desde/, '2026-12-01');
    await fill(user, /Hasta/, '2026-12-31');

    await submit(user);

    await waitFor(() => expect(created).toHaveLength(1));
    expect(created[0]).toMatchObject({
      client_id: 7,
      date_mode: 'flexible',
      window_start: '2026-12-01',
      window_end: '2026-12-31',
    });
  });

  it('una salida anterior a hoy no llega a la API', async () => {
    const user = await renderScreen({ searchParams: '?client_id=7' });
    await screen.findByText('Marcela Gómez Ortiz');
    await fill(user, /Destino/, 'San Andrés');
    await fill(user, /Salida/, '2026-11-12');

    await submit(user);

    expect(await screen.findByText('La fecha ya pasó.')).toBeInTheDocument();
    expect(created).toEqual([]);
  });

  it('desde la ficha del cliente, Cancelar vuelve a ella', async () => {
    await renderScreen({ searchParams: '?client_id=7' });
    await screen.findByText('Marcela Gómez Ortiz');

    expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute(
      'href',
      '/clientes/7',
    );
  });

  it('sin cliente, Cancelar vuelve a la lista y ofrece crear uno', async () => {
    await renderScreen();

    expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute(
      'href',
      '/solicitudes',
    );
    expect(screen.getByRole('link', { name: 'Crear cliente' })).toHaveAttribute(
      'href',
      '/clientes/nuevo?next=/solicitudes/nueva',
    );
  });

  it('sin permiso de ver clientes empieza sin cliente y lo explica', async () => {
    await renderScreen({
      searchParams: '?client_id=7',
      permissions: ['travel_requests.view', 'travel_requests.manage'],
    });

    expect(
      screen.getByText(
        'Para elegir el cliente se necesita el permiso de ver clientes.',
      ),
    ).toBeInTheDocument();
  });
});

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { OnUrlUpdateFunction } from 'nuqs/adapters/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { buildPage } from '@/test/clients';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';
import {
  buildTravelRequestListItem,
  buildTravelRequestSummary,
} from '@/test/travel-requests';

import type { TravelRequestListItem } from '../api';
import { PendingScreen } from './pending-screen';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

const OLDEST = buildTravelRequestListItem({ waiting_days: 6 });
const NEWEST = buildTravelRequestListItem({
  id: 240,
  code: 'SOL-0240',
  client: { id: 8, display_name: 'Julián Prieto Mora' },
  destination: 'Cartagena',
  date_mode: 'flexible',
  departure_date: null,
  return_date: null,
  window_start: '2026-12-01',
  window_end: '2026-12-31',
  status: 'quoting',
  assigned_to: { id: 5, full_name: 'Lucía Rangel', is_active: true },
  waiting_days: 0,
});

let lists: URLSearchParams[] = [];

const respondWith = (results: TravelRequestListItem[] = [OLDEST, NEWEST]) =>
  server.use(
    http.get(apiUrl('/api/travel-requests'), ({ request }) => {
      lists.push(new URL(request.url).searchParams);
      return HttpResponse.json(buildPage(results));
    }),
  );

beforeEach(() => {
  lists = [];
  respondWith();
  server.use(
    sessionHandler(
      buildSession({ id: 2, permissions: ['travel_requests.view'] }),
    ),
    http.get(apiUrl('/api/travel-requests/summary'), () =>
      HttpResponse.json(buildTravelRequestSummary()),
    ),
  );
});

const lastList = () => Object.fromEntries(lists.at(-1)!);

const renderScreen = ({
  searchParams = '',
  onUrlUpdate,
}: { searchParams?: string; onUrlUpdate?: OnUrlUpdateFunction } = {}) =>
  renderWithProviders(
    <SessionGuard>
      <PendingScreen />
    </SessionGuard>,
    { searchParams, onUrlUpdate },
  );

const rowOf = async (code: string) =>
  within((await screen.findByRole('link', { name: code })).closest('tr')!);

describe('PendingScreen', () => {
  it('pide las pendientes de la más antigua a la más nueva, sin la búsqueda ni el estado de la lista', async () => {
    renderScreen({ searchParams: '?q=nada&status=closed' });

    await screen.findByRole('link', { name: 'SOL-0231' });
    expect(lastList()).toEqual({
      status: 'pending',
      sort: 'oldest',
      page: '1',
      page_size: '20',
    });
    const codes = screen
      .getAllByRole('link', { name: /^SOL-/ })
      .map((link) => link.textContent);
    expect(codes).toEqual(['SOL-0231', 'SOL-0240']);
  });

  it('muestra los conteos de arriba', async () => {
    renderScreen();

    const cards = within(
      await screen.findByRole('list', { name: 'Resumen de pendientes' }),
    );
    // Mientras el resumen carga, las tarjetas muestran una raya.
    await waitFor(() =>
      expect(cards.getByText('Pendientes').previousSibling).toHaveTextContent(
        '6',
      ),
    );
    expect(
      cards.getByText('Con borrador iniciado').previousSibling,
    ).toHaveTextContent('2');
    expect(
      cards.getByText('Esperan más de 3 días').previousSibling,
    ).toHaveTextContent('2');
  });

  it('cada fila dice quién la atiende, cuándo sale y cuánto lleva esperando', async () => {
    renderScreen();

    const oldest = await rowOf('SOL-0231');
    expect(oldest.getByText('Marcela Gómez Ortiz')).toBeVisible();
    expect(oldest.getByText('Asesor: Andrés Peña')).toBeVisible();
    expect(oldest.getByText('San Andrés')).toBeVisible();
    expect(oldest.getByText('18 dic 2026')).toBeVisible();
    expect(oldest.getByText('Nueva')).toBeVisible();
    expect(oldest.getByText('6 días')).toBeVisible();
    expect(
      oldest.getByRole('link', { name: 'Abrir SOL-0231' }),
    ).toHaveAttribute('href', '/solicitudes/231');

    const newest = await rowOf('SOL-0240');
    expect(newest.getByText('Desde 1 dic 2026')).toBeVisible();
    expect(newest.getByText('En cotización')).toBeVisible();
    expect(newest.getByText('Hoy')).toBeVisible();
  });

  it('"Mis solicitudes" pide solo las del asesor de la sesión', async () => {
    renderScreen();
    await screen.findByRole('link', { name: 'SOL-0231' });

    await userEvent
      .setup()
      .click(screen.getByRole('switch', { name: 'Mis solicitudes' }));

    await waitFor(() => expect(lastList()).toMatchObject({ assigned_to: '2' }));
  });

  it('sin pendientes lo dice', async () => {
    respondWith([]);
    renderScreen();

    expect(
      await screen.findByText('No hay solicitudes por cotizar.'),
    ).toBeInTheDocument();
  });

  it('con "Mis solicitudes" y ninguna pendiente ofrece quitar el filtro', async () => {
    respondWith([]);
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderScreen({ searchParams: '?mine=true', onUrlUpdate });

    expect(
      await screen.findByText('No hay solicitudes pendientes que coincidan.'),
    ).toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    expect(onUrlUpdate.mock.lastCall![0].queryString).toBe('');
  });
});

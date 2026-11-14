import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { OnUrlUpdateFunction } from 'nuqs/adapters/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { buildClientDetail, buildPage } from '@/test/clients';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';
import {
  buildTravelRequestListItem,
  buildTravelRequestSummary,
} from '@/test/travel-requests';

import { RequestsScreen } from './requests-screen';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

const ALL = ['clients.view', 'travel_requests.view', 'travel_requests.manage'];

let lists: URLSearchParams[] = [];
let summaries: URLSearchParams[] = [];

const respondWith = (results = [buildTravelRequestListItem()]) =>
  server.use(
    http.get(apiUrl('/api/travel-requests'), ({ request }) => {
      lists.push(new URL(request.url).searchParams);
      return HttpResponse.json(buildPage(results));
    }),
  );

beforeEach(() => {
  // Solo la fecha: "hace cuánto" queda fijo y los temporizadores siguen siendo reales.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-13T15:00:00Z'));
  lists = [];
  summaries = [];
  respondWith();
  server.use(
    http.get(apiUrl('/api/travel-requests/summary'), ({ request }) => {
      summaries.push(new URL(request.url).searchParams);
      return HttpResponse.json(buildTravelRequestSummary());
    }),
    http.get(apiUrl('/api/clients/7'), () =>
      HttpResponse.json(
        buildClientDetail({ id: 7, display_name: 'Marcela Gómez Ortiz' }),
      ),
    ),
  );
});

afterEach(() => {
  vi.useRealTimers();
});

const lastList = () => Object.fromEntries(lists.at(-1)!);
const lastSummary = () => Object.fromEntries(summaries.at(-1)!);

const renderScreen = ({
  permissions = ALL,
  searchParams = '',
  onUrlUpdate,
}: {
  permissions?: string[];
  searchParams?: string;
  onUrlUpdate?: OnUrlUpdateFunction;
} = {}) => {
  server.use(sessionHandler(buildSession({ id: 2, permissions })));
  return renderWithProviders(
    <SessionGuard>
      <RequestsScreen />
    </SessionGuard>,
    { searchParams, onUrlUpdate },
  );
};

const tabs = () =>
  screen.getByRole('group', { name: 'Estado de la solicitud' });

describe('RequestsScreen', () => {
  it('lee los filtros de la URL; los conteos no siguen la búsqueda ni el estado', async () => {
    renderScreen({
      searchParams: '?q=sol-231&status=new&mine=true&client_id=7&page=2',
    });

    await screen.findByRole('link', { name: 'SOL-0231' });
    expect(lastList()).toEqual({
      q: 'sol-231',
      status: 'new',
      assigned_to: '2',
      client_id: '7',
      sort: 'recent',
      page: '2',
      page_size: '20',
    });
    expect(lastSummary()).toEqual({ assigned_to: '2', client_id: '7' });
    expect(screen.getByRole('searchbox')).toHaveValue('sol-231');
    expect(
      screen.getByRole('switch', { name: 'Mis solicitudes' }),
    ).toBeChecked();
    expect(
      within(tabs()).getByRole('button', { name: /Nuevas/ }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('un estado desconocido en la URL no se envía', async () => {
    renderScreen({ searchParams: '?status=pending' });

    await screen.findByRole('link', { name: 'SOL-0231' });
    expect(lastList()).not.toHaveProperty('status');
  });

  it('cada pestaña muestra su conteo y al elegirla filtra desde la primera página', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderScreen({ searchParams: '?page=3', onUrlUpdate });

    await waitFor(() =>
      expect(
        within(tabs()).getByRole('button', { name: 'Todas · 10' }),
      ).toBeVisible(),
    );
    for (const name of [
      'Nuevas · 4',
      'En cotización · 2',
      'Cotizadas · 3',
      'Cerradas · 1',
    ]) {
      expect(within(tabs()).getByRole('button', { name })).toBeVisible();
    }

    await userEvent
      .setup()
      .click(within(tabs()).getByRole('button', { name: 'Cerradas · 1' }));

    expect(onUrlUpdate.mock.lastCall![0].queryString).toBe('?status=closed');
    await waitFor(() => expect(lastList()).toMatchObject({ status: 'closed' }));
  });

  it('"Mis solicitudes" pide las del asesor de la sesión', async () => {
    renderScreen();
    await screen.findByRole('link', { name: 'SOL-0231' });

    await userEvent
      .setup()
      .click(screen.getByRole('switch', { name: 'Mis solicitudes' }));

    await waitFor(() => expect(lastList()).toMatchObject({ assigned_to: '2' }));
    expect(lastSummary()).toEqual({ assigned_to: '2' });
  });

  it('quitar la etiqueta del cliente quita el filtro', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderScreen({ searchParams: '?client_id=7', onUrlUpdate });

    expect(
      await screen.findByText('Cliente: Marcela Gómez Ortiz'),
    ).toBeInTheDocument();
    await userEvent
      .setup()
      .click(
        screen.getByRole('button', { name: 'Quitar el filtro por cliente' }),
      );

    expect(onUrlUpdate.mock.lastCall![0].queryString).toBe('');
    await waitFor(() => expect(lastList()).not.toHaveProperty('client_id'));
  });

  it('cada fila muestra la solicitud y lleva a su ficha', async () => {
    renderScreen();

    const row = within(
      (await screen.findByRole('link', { name: 'SOL-0231' })).closest('tr')!,
    );
    expect(row.getByText('Marcela Gómez Ortiz')).toBeVisible();
    expect(row.getByText('Actualizada hace 1 día')).toBeVisible();
    expect(row.getByText('San Andrés')).toBeVisible();
    expect(row.getByText('18–24 dic 2026')).toBeVisible();
    expect(row.getByText('2 adultos · 1 menor')).toBeVisible();
    expect(row.getByText('Nueva')).toBeVisible();
    expect(row.getByText('Andrés Peña')).toBeVisible();
    expect(row.getByRole('link', { name: 'Abrir SOL-0231' })).toHaveAttribute(
      'href',
      '/solicitudes/231',
    );
  });

  it('"Nueva solicitud" lleva el cliente del filtro y no aparece sin gestionar', async () => {
    renderScreen({ searchParams: '?client_id=7' });

    expect(
      await screen.findByRole('link', { name: /Nueva solicitud/ }),
    ).toHaveAttribute('href', '/solicitudes/nueva?client_id=7');
  });

  it('sin travel_requests.manage no ofrece registrar', async () => {
    renderScreen({ permissions: ['travel_requests.view'] });

    await screen.findByRole('link', { name: 'SOL-0231' });
    expect(
      screen.queryByRole('link', { name: /Nueva solicitud/ }),
    ).not.toBeInTheDocument();
  });

  it('sin ninguna solicitud invita a registrar la primera', async () => {
    respondWith([]);
    renderScreen();

    expect(
      await screen.findByText('Aún no hay solicitudes registradas'),
    ).toBeInTheDocument();
  });

  it('con filtros que no dejan nada ofrece limpiarlos', async () => {
    respondWith([]);
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderScreen({ searchParams: '?q=nada&status=quoted', onUrlUpdate });

    expect(
      await screen.findByText(
        'No hay solicitudes que coincidan con la búsqueda',
      ),
    ).toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    expect(onUrlUpdate.mock.lastCall![0].queryString).toBe('');
  });
});

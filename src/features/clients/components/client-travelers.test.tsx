import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import {
  buildClientAsTraveler,
  buildClientDetail,
  buildCompanyDetail,
  buildPage,
  buildTravelerListItem,
} from '@/test/clients';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import type { ClientDetail } from '../api';
import { ClientTravelers } from './client-travelers';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

const ALL = [
  'clients.view',
  'clients.manage',
  'travelers.view',
  'travelers.manage',
];

let requests: URLSearchParams[] = [];

const respondWith = (
  results = [buildTravelerListItem()],
  next: string | null = null,
) =>
  server.use(
    http.get(apiUrl('/api/travelers'), ({ request }) => {
      requests.push(new URL(request.url).searchParams);
      return HttpResponse.json(buildPage(results, { next }));
    }),
  );

beforeEach(() => {
  requests = [];
  respondWith();
});

const renderSection = ({
  client = buildClientDetail(),
  permissions = ALL,
}: { client?: ClientDetail; permissions?: string[] } = {}) => {
  server.use(sessionHandler(buildSession({ permissions })));
  renderWithProviders(
    <SessionGuard>
      <h1>Ficha</h1>
      <ClientTravelers client={client} />
    </SessionGuard>,
  );
};

const section = () =>
  screen.findByRole('region', { name: 'Viajeros de referencia' });

describe('ClientTravelers', () => {
  it('pide los viajeros del cliente y muestra nombre, documento, edad y marcas', async () => {
    respondWith([
      buildTravelerListItem(),
      { ...buildClientAsTraveler(), reference_client: null },
    ]);
    renderSection();

    const list = within(await section());
    const minor = (
      await list.findByRole('link', { name: 'Sofía Gómez Ruiz' })
    ).closest('li')!;
    expect(within(minor).getByText('TI 1090123456')).toBeVisible();
    expect(within(minor).getByText('12 años')).toBeVisible();
    expect(within(minor).getByText('Menor')).toBeVisible();
    const own = list
      .getByRole('link', { name: 'Marcela Gómez Ortiz' })
      .closest('li')!;
    expect(within(own).getByText('Es el cliente')).toBeVisible();
    expect(within(own).queryByText('Menor')).not.toBeInTheDocument();
    expect(Object.fromEntries(requests.at(-1)!)).toEqual({
      client_id: '12',
      page_size: '100',
    });
  });

  it('sin viajeros lo dice', async () => {
    respondWith([]);
    renderSection();

    expect(
      await screen.findByText(
        'Este cliente todavía no tiene viajeros registrados.',
      ),
    ).toBeInTheDocument();
  });

  it('a una persona sin ficha de viajero le ofrece registrarse como viajero', async () => {
    renderSection();

    expect(
      await screen.findByRole('link', { name: 'Registrar como viajero' }),
    ).toHaveAttribute('href', '/viajeros/nuevo?from_client=12');
    expect(screen.getByRole('link', { name: 'Nuevo viajero' })).toHaveAttribute(
      'href',
      '/viajeros/nuevo?client_id=12',
    );
  });

  it('no ofrece "Registrar como viajero" si ya tiene su ficha de viajero', async () => {
    respondWith([buildClientAsTraveler()]);
    renderSection();

    await screen.findByText('Es el cliente');
    expect(
      screen.queryByRole('link', { name: 'Registrar como viajero' }),
    ).not.toBeInTheDocument();
  });

  it('no ofrece "Registrar como viajero" a una empresa', async () => {
    renderSection({ client: buildCompanyDetail() });

    await screen.findByRole('link', { name: 'Nuevo viajero' });
    expect(
      screen.queryByRole('link', { name: 'Registrar como viajero' }),
    ).not.toBeInTheDocument();
  });

  it('sin travelers.manage muestra la lista sin botones', async () => {
    renderSection({ permissions: ['clients.view', 'travelers.view'] });

    await screen.findByRole('link', { name: 'Sofía Gómez Ruiz' });
    expect(
      screen.queryByRole('link', { name: 'Nuevo viajero' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Registrar como viajero' }),
    ).not.toBeInTheDocument();
  });

  it('sin travelers.view no muestra la sección ni pide los viajeros', async () => {
    renderSection({ permissions: ['clients.view', 'clients.manage'] });

    await screen.findByRole('heading', { name: 'Ficha' });
    expect(
      screen.queryByRole('region', { name: 'Viajeros de referencia' }),
    ).not.toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it('si hay más de una página, enlaza a la lista filtrada', async () => {
    respondWith([buildTravelerListItem()], 'http://api/travelers?page=2');
    renderSection();

    expect(
      await screen.findByRole('link', { name: /Ver todos/ }),
    ).toHaveAttribute('href', '/viajeros?client_id=12');
  });
});

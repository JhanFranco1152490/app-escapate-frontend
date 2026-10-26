import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { OnUrlUpdateFunction } from 'nuqs/adapters/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import {
  buildClientAsTraveler,
  buildClientDetail,
  buildPage,
  buildTravelerListItem,
} from '@/test/clients';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { TravelersScreen } from './travelers-screen';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

let requests: URLSearchParams[] = [];

const respondWith = (
  respond: (query: URLSearchParams) => Response = () =>
    HttpResponse.json(buildPage([buildTravelerListItem()])),
) =>
  server.use(
    http.get(apiUrl('/api/travelers'), ({ request }) => {
      const query = new URL(request.url).searchParams;
      requests.push(query);
      return respond(query);
    }),
  );

beforeEach(() => {
  requests = [];
  respondWith();
  server.use(
    http.get(apiUrl('/api/clients/12'), () =>
      HttpResponse.json(buildClientDetail()),
    ),
  );
});

const lastRequest = () => Object.fromEntries(requests.at(-1)!);

// La etiqueta del filtro dice lo mismo que la fila del viajero: se ubica por su botón.
const clientTag = () =>
  screen.getByRole('button', { name: 'Quitar el filtro por cliente' })
    .parentElement!;

const renderScreen = ({
  permissions = ['clients.view', 'travelers.view', 'travelers.manage'],
  searchParams = '',
  onUrlUpdate,
}: {
  permissions?: string[];
  searchParams?: string;
  onUrlUpdate?: OnUrlUpdateFunction;
} = {}) => {
  server.use(sessionHandler(buildSession({ permissions })));
  return renderWithProviders(
    <SessionGuard>
      <TravelersScreen />
    </SessionGuard>,
    { searchParams, onUrlUpdate },
  );
};

describe('TravelersScreen', () => {
  it('lee la búsqueda y el cliente de la URL y los envía a la API', async () => {
    renderScreen({ searchParams: '?q=sofia&client_id=12&page=2' });

    await screen.findByText('Sofía Gómez Ruiz');
    expect(lastRequest()).toEqual({
      q: 'sofia',
      client_id: '12',
      page: '2',
      page_size: '20',
    });
    expect(screen.getByRole('searchbox')).toHaveValue('sofia');
    await waitFor(() =>
      expect(clientTag()).toHaveTextContent('Cliente: Marcela Gómez Ortiz'),
    );
  });

  it.each([['0'], ['-3'], ['abc'], ['9007199254740993']])(
    'un client_id imposible en la URL (%s) no se envía a la API',
    async (clientId) => {
      renderScreen({ searchParams: `?client_id=${clientId}` });

      await screen.findByText('Sofía Gómez Ruiz');
      expect(lastRequest()).not.toHaveProperty('client_id');
    },
  );

  it('quitar la etiqueta del cliente quita el filtro de la URL', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderScreen({ searchParams: '?client_id=12&page=2', onUrlUpdate });
    await screen.findByText('Sofía Gómez Ruiz');

    await userEvent
      .setup()
      .click(
        screen.getByRole('button', { name: 'Quitar el filtro por cliente' }),
      );

    expect(onUrlUpdate.mock.lastCall![0].queryString).toBe('');
    await waitFor(() => expect(lastRequest()).not.toHaveProperty('client_id'));
  });

  it('sin clients.view la etiqueta no pide el nombre del cliente', async () => {
    let clientRequests = 0;
    server.use(
      http.get(apiUrl('/api/clients/12'), () => {
        clientRequests += 1;
        return HttpResponse.json(buildClientDetail());
      }),
    );
    renderScreen({
      permissions: ['travelers.view'],
      searchParams: '?client_id=12',
    });

    await screen.findByText('Sofía Gómez Ruiz');
    expect(clientTag()).toHaveTextContent('Cliente filtrado');
    expect(clientRequests).toBe(0);
  });

  it('muestra el cliente de referencia, la edad, "Menor" y la nacionalidad', async () => {
    respondWith(() =>
      HttpResponse.json(
        buildPage([
          buildTravelerListItem(),
          {
            ...buildClientAsTraveler(),
            reference_client: { id: 12, display_name: 'Marcela Gómez Ortiz' },
          },
          buildTravelerListItem({
            id: 40,
            full_name: 'Helena Rincón Soto',
            reference_client: null,
            nationality: 'VE',
            age: 66,
            is_minor: false,
          }),
        ]),
      ),
    );
    renderScreen();

    const rowOf = async (name: string) =>
      within((await screen.findByRole('link', { name })).closest('tr')!);
    const minor = await rowOf('Sofía Gómez Ruiz');
    expect(minor.getByText('Cliente: Marcela Gómez Ortiz')).toBeVisible();
    expect(minor.getByText('TI 1090123456')).toBeVisible();
    expect(minor.getByText(/12 de marzo de 2014/)).toBeVisible();
    expect(minor.getByText(/12 años/)).toBeVisible();
    expect(minor.getByText('Menor')).toBeVisible();
    expect(minor.getByText('Colombia')).toBeVisible();
    expect(
      (await rowOf('Marcela Gómez Ortiz')).getByText('Es también cliente'),
    ).toBeVisible();
    const alone = await rowOf('Helena Rincón Soto');
    expect(alone.getByText('Venezuela')).toBeVisible();
    expect(alone.queryByText(/Cliente:/)).not.toBeInTheDocument();
    expect(alone.queryByText('Menor')).not.toBeInTheDocument();
  });

  it('sin resultados con filtros ofrece limpiarlos', async () => {
    respondWith((query) =>
      HttpResponse.json(
        buildPage(query.get('q') ? [] : [buildTravelerListItem()]),
      ),
    );
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderScreen({ searchParams: '?q=nadie', onUrlUpdate });

    expect(
      await screen.findByText('No hay viajeros que coincidan con la búsqueda'),
    ).toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    expect(onUrlUpdate.mock.lastCall![0].queryString).toBe('');
    expect(await screen.findByText('Sofía Gómez Ruiz')).toBeInTheDocument();
  });

  it('sin ningún viajero invita a registrar el primero', async () => {
    respondWith(() => HttpResponse.json(buildPage([])));
    renderScreen();

    expect(
      await screen.findByText('Aún no hay viajeros registrados'),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Nuevo viajero' })).toHaveLength(
      2,
    );
  });

  it('sin travelers.manage no ofrece registrar viajeros', async () => {
    renderScreen({ permissions: ['travelers.view'] });

    await screen.findByText('Sofía Gómez Ruiz');
    expect(
      screen.queryByRole('link', { name: 'Nuevo viajero' }),
    ).not.toBeInTheDocument();
  });

  it('una página fuera de rango vuelve a la primera', async () => {
    respondWith((query) =>
      query.get('page') === '3'
        ? HttpResponse.json(
            { detail: 'No encontrado.', code: 'not_found', fields: {} },
            { status: 404 },
          )
        : HttpResponse.json(buildPage([buildTravelerListItem()])),
    );
    renderScreen({ searchParams: '?page=3' });

    expect(await screen.findByText('Sofía Gómez Ruiz')).toBeInTheDocument();
    expect(lastRequest().page).toBe('1');
  });

  it('un 403 de la API muestra el estado sin permiso', async () => {
    respondWith(() =>
      HttpResponse.json(
        { detail: 'Sin permiso.', code: 'permission_denied', fields: {} },
        { status: 403 },
      ),
    );
    renderScreen();

    expect(
      await screen.findByText('No tienes acceso a esta sección'),
    ).toBeInTheDocument();
  });
});

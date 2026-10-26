import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { OnUrlUpdateFunction } from 'nuqs/adapters/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import {
  buildClientListItem,
  buildCompanyDetail,
  buildPage,
} from '@/test/clients';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { ClientsScreen } from './clients-screen';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

let requests: URLSearchParams[] = [];

const respondWith = (
  respond: (query: URLSearchParams) => Response = () =>
    HttpResponse.json(buildPage([buildClientListItem()])),
) =>
  server.use(
    http.get(apiUrl('/api/clients'), ({ request }) => {
      const query = new URL(request.url).searchParams;
      requests.push(query);
      return respond(query);
    }),
  );

beforeEach(() => {
  requests = [];
  respondWith();
});

const lastRequest = () => Object.fromEntries(requests.at(-1)!);

const renderScreen = ({
  permissions = ['clients.view', 'clients.manage'],
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
      <ClientsScreen />
    </SessionGuard>,
    { searchParams, onUrlUpdate },
  );
};

describe('ClientsScreen', () => {
  it('lee los filtros de la URL y los envía a la API', async () => {
    renderScreen({ searchParams: '?q=gomez&client_type=company&page=2' });

    await screen.findByText('Marcela Gómez Ortiz');
    expect(lastRequest()).toEqual({
      q: 'gomez',
      client_type: 'company',
      page: '2',
      page_size: '20',
    });
    expect(screen.getByRole('searchbox')).toHaveValue('gomez');
    expect(screen.getByRole('button', { name: 'Empresas' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('un client_type desconocido en la URL no se envía', async () => {
    renderScreen({ searchParams: '?client_type=otro' });

    await screen.findByText('Marcela Gómez Ortiz');
    expect(lastRequest()).not.toHaveProperty('client_type');
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('buscar escribe q en la URL y vuelve a la primera página', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderScreen({ searchParams: '?page=2', onUrlUpdate });
    await screen.findByText('Marcela Gómez Ortiz');

    await userEvent.setup().type(screen.getByRole('searchbox'), '300 111');

    await waitFor(() => expect(lastRequest().q).toBe('300 111'));
    expect(onUrlUpdate.mock.lastCall![0].queryString).toBe('?q=300+111');
  });

  it('cambiar de pestaña escribe el tipo en la URL y borra la página', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderScreen({ searchParams: '?page=2', onUrlUpdate });
    await screen.findByText('Marcela Gómez Ortiz');

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Personas' }));

    expect(onUrlUpdate.mock.lastCall![0].queryString).toBe(
      '?client_type=person',
    );
    await waitFor(() =>
      expect(lastRequest()).toMatchObject({ client_type: 'person', page: '1' }),
    );
  });

  it('muestra cada fila con el documento y el teléfono formateados', async () => {
    const company = buildCompanyDetail();
    respondWith(() =>
      HttpResponse.json(
        buildPage([
          buildClientListItem(),
          buildClientListItem({
            id: company.id,
            client_type: company.client_type,
            display_name: company.display_name,
            email: null,
            phone: '+584125550101',
            document_type: company.document_type,
            document_number: company.document_number,
            city: null,
          }),
          buildClientListItem({
            id: 14,
            display_name: 'Julián Prieto',
            document_type: null,
            document_number: null,
          }),
        ]),
      ),
    );
    renderScreen();

    const rowOf = async (name: string) =>
      (await screen.findByRole('link', { name })).closest('tr')!;
    const person = within(await rowOf('Marcela Gómez Ortiz'));
    expect(person.getByText('CC 1.020.304.050')).toBeVisible();
    expect(person.getByText('300 111 2233')).toBeVisible();
    expect(person.getByText('marcela.gomez@example.com')).toBeVisible();
    expect(person.getByText('Cúcuta')).toBeVisible();
    const companyRow = within(await rowOf('Viajes Andinos S.A.S.'));
    expect(companyRow.getByText('NIT 900.123.456-8')).toBeVisible();
    expect(companyRow.getByText('+58 412 5550101')).toBeVisible();
    expect(companyRow.getByText('—')).toBeVisible();
    expect(
      within(await rowOf('Julián Prieto')).getByText('Sin documento'),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Viajes Andinos S.A.S.' }),
    ).toHaveAttribute('href', '/clientes/13');
  });

  it('sin resultados con filtros ofrece limpiarlos', async () => {
    respondWith((query) =>
      HttpResponse.json(
        buildPage(query.get('q') ? [] : [buildClientListItem()]),
      ),
    );
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderScreen({ searchParams: '?q=nadie&client_type=person', onUrlUpdate });

    expect(
      await screen.findByText('No hay clientes que coincidan con la búsqueda'),
    ).toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    expect(onUrlUpdate.mock.lastCall![0].queryString).toBe('');
    expect(await screen.findByText('Marcela Gómez Ortiz')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });

  it('sin ningún cliente invita a registrar el primero', async () => {
    respondWith(() => HttpResponse.json(buildPage([])));
    renderScreen();

    expect(
      await screen.findByText('Aún no hay clientes registrados'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Limpiar filtros' }),
    ).not.toBeInTheDocument();
    // Uno en la cabecera y otro en el estado vacío.
    expect(screen.getAllByRole('link', { name: 'Nuevo cliente' })).toHaveLength(
      2,
    );
  });

  it('pagina con Siguiente y muestra el rango', async () => {
    respondWith(() =>
      HttpResponse.json(
        buildPage([buildClientListItem()], {
          count: 45,
          next: 'http://api/clients?page=2',
        }),
      ),
    );
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderScreen({ onUrlUpdate });

    expect(await screen.findByText('1–20 de 45')).toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(onUrlUpdate.mock.lastCall![0].queryString).toBe('?page=2');
  });

  it('una página fuera de rango vuelve a la primera', async () => {
    respondWith((query) =>
      query.get('page') === '3'
        ? HttpResponse.json(
            { detail: 'No encontrado.', code: 'not_found', fields: {} },
            { status: 404 },
          )
        : HttpResponse.json(buildPage([buildClientListItem()])),
    );
    renderScreen({ searchParams: '?page=3' });

    expect(await screen.findByText('Marcela Gómez Ortiz')).toBeInTheDocument();
    expect(lastRequest().page).toBe('1');
  });

  it('un error de la API ofrece reintentar', async () => {
    respondWith(() =>
      HttpResponse.json(
        { detail: 'Error.', code: 'internal_error', fields: {} },
        { status: 500 },
      ),
    );
    renderScreen();

    expect(
      await screen.findByText('No pudimos cargar los clientes'),
    ).toBeInTheDocument();
    respondWith();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Marcela Gómez Ortiz')).toBeInTheDocument();
  });

  it('sin clients.manage no ofrece registrar clientes', async () => {
    respondWith(() => HttpResponse.json(buildPage([])));
    renderScreen({ permissions: ['clients.view'] });

    await screen.findByText('Aún no hay clientes registrados');
    expect(
      screen.queryByRole('link', { name: 'Nuevo cliente' }),
    ).not.toBeInTheDocument();
  });

  it('con clients.manage "Nuevo cliente" lleva al alta', async () => {
    renderScreen();

    expect(
      await screen.findByRole('link', { name: 'Nuevo cliente' }),
    ).toHaveAttribute('href', '/clientes/nuevo');
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

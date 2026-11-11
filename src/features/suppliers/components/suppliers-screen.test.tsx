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
import { buildSupplierListItem } from '@/test/suppliers';

import { SuppliersScreen } from './suppliers-screen';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

let requests: URLSearchParams[] = [];

const respondWith = (
  respond: (query: URLSearchParams) => Response = () =>
    HttpResponse.json(buildPage([buildSupplierListItem()])),
) =>
  server.use(
    http.get(apiUrl('/api/suppliers'), ({ request }) => {
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
  permissions = ['suppliers.view', 'suppliers.manage'],
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
      <SuppliersScreen />
    </SessionGuard>,
    { searchParams, onUrlUpdate },
  );
};

describe('SuppliersScreen', () => {
  it('por defecto pide solo los activos', async () => {
    renderScreen();

    await screen.findByText('Hotel Costa Azul');
    expect(lastRequest()).toEqual({
      status: 'active',
      page: '1',
      page_size: '20',
    });
    expect(screen.getByRole('combobox', { name: 'Estado' })).toHaveValue(
      'active',
    );
  });

  it('lee los filtros de la URL y los envía a la API', async () => {
    renderScreen({
      searchParams: '?q=costa&category=lodging&status=all&page=2',
    });

    await screen.findByText('Hotel Costa Azul');
    expect(lastRequest()).toEqual({
      q: 'costa',
      category: 'lodging',
      status: 'all',
      page: '2',
      page_size: '20',
    });
    expect(screen.getByRole('searchbox')).toHaveValue('costa');
    expect(screen.getByRole('button', { name: 'Alojamiento' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('combobox', { name: 'Estado' })).toHaveValue('all');
  });

  it('una clasificación o un estado desconocidos en la URL no se envían', async () => {
    renderScreen({ searchParams: '?category=otra&status=nada' });

    await screen.findByText('Hotel Costa Azul');
    expect(lastRequest()).not.toHaveProperty('category');
    expect(lastRequest().status).toBe('active');
  });

  it('buscar escribe q en la URL y vuelve a la primera página', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderScreen({ searchParams: '?page=2', onUrlUpdate });
    await screen.findByText('Hotel Costa Azul');

    await userEvent.setup().type(screen.getByRole('searchbox'), 'costa');

    await waitFor(() => expect(lastRequest().q).toBe('costa'));
    expect(onUrlUpdate.mock.lastCall![0].queryString).toBe('?q=costa');
  });

  it('cambiar de clasificación la escribe en la URL y borra la página', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderScreen({ searchParams: '?page=2', onUrlUpdate });
    await screen.findByText('Hotel Costa Azul');

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Transporte aéreo' }));

    expect(onUrlUpdate.mock.lastCall![0].queryString).toBe('?category=air');
    await waitFor(() =>
      expect(lastRequest()).toMatchObject({ category: 'air', page: '1' }),
    );
  });

  it('elegir "Todos" guarda status=all y volver a "Activos" lo quita de la URL', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderScreen({ onUrlUpdate });
    await screen.findByText('Hotel Costa Azul');
    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Estado' }),
      'Todos',
    );
    expect(onUrlUpdate.mock.lastCall![0].queryString).toBe('?status=all');

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Estado' }),
      'Activos',
    );
    expect(onUrlUpdate.mock.lastCall![0].queryString).toBe('');
  });

  it('muestra cada fila con documento, categorías, contacto, servicios y estado', async () => {
    respondWith(() =>
      HttpResponse.json(
        buildPage([
          buildSupplierListItem(),
          buildSupplierListItem({
            id: 41,
            trade_name: 'Naviera del Mar',
            document_type: 'FOREIGN',
            document_number: 'A1234567',
            categories: ['cruise'],
            contact_name: 'Iván Peña',
            contact_email: null,
            contact_phone: '+573001112233',
            city: null,
            is_active: false,
            active_service_count: 0,
          }),
          buildSupplierListItem({
            id: 42,
            trade_name: 'Guía Independiente',
            document_type: null,
            document_number: null,
          }),
        ]),
      ),
    );
    renderScreen();

    const rowOf = async (name: string) =>
      (await screen.findByRole('link', { name })).closest('tr')!;
    const hotel = within(await rowOf('Hotel Costa Azul'));
    expect(hotel.getByText('NIT 800.111.222-7')).toBeVisible();
    expect(hotel.getByText('Alojamiento')).toBeVisible();
    expect(hotel.getByText('Tours y actividades')).toBeVisible();
    expect(hotel.getByText('Mónica Salas')).toBeVisible();
    expect(hotel.getByText('ventas@example.com')).toBeVisible();
    expect(hotel.getByText('Cartagena')).toBeVisible();
    expect(hotel.getByText('Activo')).toBeVisible();
    expect(hotel.getByText('2')).toBeVisible();
    const naviera = within(await rowOf('Naviera del Mar'));
    expect(naviera.getByText('Id. extranjera A1234567')).toBeVisible();
    expect(naviera.getByText('300 111 2233')).toBeVisible();
    expect(naviera.getByText('—')).toBeVisible();
    expect(naviera.getByText('Inactivo')).toBeVisible();
    expect(naviera.getByText('0')).toBeVisible();
    expect(
      within(await rowOf('Guía Independiente')).getByText('Sin documento'),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Naviera del Mar' }),
    ).toHaveAttribute('href', '/proveedores/41');
  });

  it('sin resultados con filtros ofrece limpiarlos', async () => {
    respondWith((query) =>
      HttpResponse.json(
        buildPage(query.get('q') ? [] : [buildSupplierListItem()]),
      ),
    );
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderScreen({ searchParams: '?q=nadie&status=inactive', onUrlUpdate });

    expect(
      await screen.findByText(
        'No hay proveedores que coincidan con la búsqueda',
      ),
    ).toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    expect(onUrlUpdate.mock.lastCall![0].queryString).toBe('');
    expect(await screen.findByText('Hotel Costa Azul')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });

  it('sin ningún proveedor invita a registrar el primero', async () => {
    respondWith(() => HttpResponse.json(buildPage([])));
    renderScreen();

    expect(
      await screen.findByText('Aún no hay proveedores registrados'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Limpiar filtros' }),
    ).not.toBeInTheDocument();
    // Uno en la cabecera y otro en el estado vacío.
    expect(
      screen.getAllByRole('link', { name: 'Nuevo proveedor' }),
    ).toHaveLength(2);
  });

  it('pagina con Siguiente', async () => {
    respondWith(() =>
      HttpResponse.json(
        buildPage([buildSupplierListItem()], {
          count: 45,
          next: 'http://api/suppliers?page=2',
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
        : HttpResponse.json(buildPage([buildSupplierListItem()])),
    );
    renderScreen({ searchParams: '?page=3' });

    expect(await screen.findByText('Hotel Costa Azul')).toBeInTheDocument();
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
      await screen.findByText('No pudimos cargar los proveedores'),
    ).toBeInTheDocument();
    respondWith();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Hotel Costa Azul')).toBeInTheDocument();
  });

  it('sin suppliers.manage no ofrece registrar proveedores', async () => {
    respondWith(() => HttpResponse.json(buildPage([])));
    renderScreen({ permissions: ['suppliers.view'] });

    await screen.findByText('Aún no hay proveedores registrados');
    expect(
      screen.queryByRole('link', { name: 'Nuevo proveedor' }),
    ).not.toBeInTheDocument();
  });

  it('con suppliers.manage "Nuevo proveedor" lleva al alta', async () => {
    renderScreen();

    expect(
      await screen.findByRole('link', { name: 'Nuevo proveedor' }),
    ).toHaveAttribute('href', '/proveedores/nuevo');
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

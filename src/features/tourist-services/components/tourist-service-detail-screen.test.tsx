import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { clearPageNotice, setPageNotice } from '@/lib/page-notice';
import { buildPage } from '@/test/clients';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';
import { buildServiceDetail, buildServiceRate } from '@/test/tourist-services';

import { TouristServiceDetailScreen } from './tourist-service-detail-screen';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

const MANAGER = [
  'suppliers.view',
  'tourist_services.view',
  'tourist_services.manage',
];

let current = buildServiceDetail();
const RATES = buildPage([
  buildServiceRate(),
  buildServiceRate({
    id: 81,
    name: 'Temporada de diciembre',
    valid_from: '2026-12-15',
    valid_until: '2027-01-15',
    validity_status: 'upcoming',
    conditions: null,
  }),
  buildServiceRate({
    id: 82,
    name: 'Tarifa en dólares',
    currency: 'USD',
    amount: '1250.50',
    charge_unit: 'per_person_per_night',
    valid_from: '2026-01-01',
    valid_until: '2026-06-30',
    validity_status: 'expired',
    conditions: null,
  }),
]);
let rates = RATES;
let statusChanges: unknown[] = [];

beforeEach(() => {
  current = buildServiceDetail();
  rates = RATES;
  statusChanges = [];
  server.use(
    http.get(apiUrl('/api/tourist-services/60'), () =>
      HttpResponse.json(current),
    ),
    http.get(apiUrl('/api/tourist-services/60/rates'), () =>
      HttpResponse.json(rates),
    ),
    http.post(
      apiUrl('/api/tourist-services/60/deactivate'),
      async ({ request }) => {
        statusChanges.push(await request.json());
        current = buildServiceDetail({
          is_active: false,
          deactivated_at: '2026-11-10T15:00:00Z',
          version: 2,
        });
        return HttpResponse.json(current);
      },
    ),
  );
});

afterEach(() => {
  clearPageNotice();
});

const renderScreen = async (permissions = MANAGER, id = '60') => {
  server.use(sessionHandler(buildSession({ permissions })));
  renderWithProviders(
    <SessionGuard>
      <TouristServiceDetailScreen id={id} />
    </SessionGuard>,
  );
  if (id === '60') {
    await screen.findByRole('region', {
      name: 'Características y condiciones',
    });
  }
};

const section = (name: string) => within(screen.getByRole('region', { name }));

describe('TouristServiceDetailScreen', () => {
  it('muestra la ruta, el proveedor, el tipo y el estado', async () => {
    await renderScreen();

    const trail = within(screen.getByRole('navigation', { name: 'Ruta' }));
    expect(trail.getByRole('link', { name: 'Proveedores' })).toHaveAttribute(
      'href',
      '/proveedores',
    );
    expect(
      trail.getByRole('link', { name: 'Hotel Costa Azul' }),
    ).toHaveAttribute('href', '/proveedores/40');
    expect(
      screen.getByText('Hotel Costa Azul · Alojamiento'),
    ).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeVisible();
  });

  it('muestra las características del alojamiento y omite las vacías (CA-04)', async () => {
    current = buildServiceDetail({
      attributes: {
        lodging_kind: 'hotel',
        stars: 4,
        max_capacity: 4,
        check_in_time: '15:00',
        includes: ['airport_transfers', 'wifi'],
      },
    });
    await renderScreen();

    const details = section('Características y condiciones');
    expect(details.getByText('Hotel')).toBeVisible();
    expect(details.getByText('4 estrellas')).toBeVisible();
    expect(details.getByText('4 personas')).toBeVisible();
    expect(details.getByText('15:00')).toBeVisible();
    expect(details.queryByText('Check-out')).not.toBeInTheDocument();
    expect(details.queryByText('Régimen')).not.toBeInTheDocument();
    expect(details.queryByText('Descripción')).not.toBeInTheDocument();
    expect(
      details.getAllByRole('listitem').map((item) => item.textContent),
    ).toEqual(['Traslados aeropuerto', 'Wifi']);
    expect(
      details.getByText('Cancelación sin costo hasta 30 días antes.'),
    ).toBeVisible();
    expect(screen.getByText(/Por Sofía Barrios el/)).toBeVisible();
  });

  it('muestra las características de un tour', async () => {
    current = buildServiceDetail({
      service_type: 'tours',
      name: 'Tour Islas del Rosario',
      attributes: {
        duration_value: 1,
        duration_unit: 'days',
        modality: 'shared',
        includes: ['guide'],
      },
    });
    await renderScreen();

    const details = section('Características y condiciones');
    expect(details.getByText('1 día')).toBeVisible();
    expect(details.getByText('Compartido')).toBeVisible();
    expect(details.getByText('Guía')).toBeVisible();
  });

  it('avisa si el servicio y su proveedor están inactivos', async () => {
    current = buildServiceDetail({
      is_active: false,
      deactivated_at: '2026-11-10T15:00:00Z',
      supplier: { id: 40, trade_name: 'Hotel Costa Azul', is_active: false },
    });
    await renderScreen();

    expect(
      screen.getByText('Servicio inactivo desde el 10 de noviembre de 2026'),
    ).toBeVisible();
    expect(
      screen.getByText('El proveedor Hotel Costa Azul está inactivo.'),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Activar' })).toBeVisible();
  });

  it('desactivar pide confirmación y envía la versión', async () => {
    await renderScreen();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Desactivar' }));
    const dialog = within(await screen.findByRole('alertdialog'));
    expect(
      dialog.getByText(
        'Habitación familiar conectada dejará de aparecer en la oferta turística. Sus tarifas e historial se conservan.',
      ),
    ).toBeVisible();
    await user.click(dialog.getByRole('button', { name: 'Desactivar' }));

    expect(await screen.findByText('Servicio desactivado.')).toBeVisible();
    expect(statusChanges).toEqual([{ expected_version: 1 }]);
  });

  it('solo con "Ver" no ofrece editar ni cambiar el estado', async () => {
    await renderScreen(['suppliers.view', 'tourist_services.view']);

    expect(
      screen.queryByRole('link', { name: /Editar datos/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Desactivar' }),
    ).not.toBeInTheDocument();
  });

  it('muestra el aviso que dejó el formulario', async () => {
    setPageNotice({
      target: 'tourist-service:60',
      text: 'Servicio registrado.',
    });
    await renderScreen();

    expect(await screen.findByText('Servicio registrado.')).toBeVisible();
  });

  it('un servicio que no existe muestra "No encontramos este servicio"', async () => {
    server.use(
      http.get(apiUrl('/api/tourist-services/99'), () =>
        HttpResponse.json(
          { detail: 'No encontrado.', code: 'not_found', fields: {} },
          { status: 404 },
        ),
      ),
    );
    await renderScreen(MANAGER, '99');

    expect(
      await screen.findByText('No encontramos este servicio'),
    ).toBeVisible();
  });
});

describe('tarifas del servicio', () => {
  it('muestra cada tarifa con su vigencia, estado en texto y valor en su moneda (HU-16 CA-04)', async () => {
    await renderScreen();

    const table = section('Tarifas del servicio');
    expect(await table.findByText('3 registradas')).toBeVisible();
    const rowOf = (name: string) =>
      within(table.getByText(name).closest('tr')!);
    const high = rowOf('Temporada alta');
    expect(high.getByText('Hasta 4 personas por habitación.')).toBeVisible();
    expect(high.getByText('Desde 1 nov 2026')).toBeVisible();
    expect(high.getByText('Sin fecha de fin')).toBeVisible();
    expect(high.getByText('Vigente')).toBeVisible();
    expect(high.getByText('$ 710.000')).toBeVisible();
    expect(high.getByText('por noche')).toBeVisible();
    const december = rowOf('Temporada de diciembre');
    expect(december.getByText('15 dic 2026 – 15 ene 2027')).toBeVisible();
    expect(december.getByText('Próxima')).toBeVisible();
    const dollars = rowOf('Tarifa en dólares');
    expect(dollars.getByText('Vencida')).toBeVisible();
    expect(dollars.getByText('US$ 1.250,50')).toBeVisible();
    expect(dollars.getByText('por persona por noche')).toBeVisible();
  });

  it('sin tarifas lo dice', async () => {
    rates = buildPage([]);
    await renderScreen();

    expect(
      await screen.findByText('Este servicio aún no tiene tarifas.'),
    ).toBeVisible();
  });
});

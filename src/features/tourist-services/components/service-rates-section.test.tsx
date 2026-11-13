import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { buildPage } from '@/test/clients';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';
import { buildServiceRate } from '@/test/tourist-services';

import type { ServiceType } from '../api';
import { ServiceRatesSection } from './service-rates-section';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

type User = ReturnType<typeof userEvent.setup>;

const MANAGER = [
  'suppliers.view',
  'tourist_services.view',
  'tourist_services.manage',
];
const STALE_MESSAGE =
  'Alguien más guardó cambios. Recarga para ver la versión actual.';
const SERVICE_INACTIVE =
  'El servicio está inactivo. Actívalo antes de agregarle tarifas.';

const staleResponse = () =>
  HttpResponse.json(
    { detail: STALE_MESSAGE, code: 'stale_version', fields: {} },
    { status: 409 },
  );

let rates = [buildServiceRate()];
let sent: { method: string; url: URL; body: unknown }[] = [];

beforeEach(() => {
  rates = [buildServiceRate()];
  sent = [];
  const record = async (request: Request) => {
    const body = request.method === 'DELETE' ? null : await request.json();
    sent.push({ method: request.method, url: new URL(request.url), body });
  };
  server.use(
    http.get(apiUrl('/api/tourist-services/60/rates'), () =>
      HttpResponse.json(buildPage(rates)),
    ),
    http.post(apiUrl('/api/tourist-services/60/rates'), async ({ request }) => {
      await record(request);
      return HttpResponse.json(buildServiceRate({ id: 90 }), { status: 201 });
    }),
    http.put(
      apiUrl('/api/tourist-services/60/rates/80'),
      async ({ request }) => {
        await record(request);
        return HttpResponse.json(buildServiceRate({ version: 2 }));
      },
    ),
    http.delete(
      apiUrl('/api/tourist-services/60/rates/80'),
      async ({ request }) => {
        await record(request);
        rates = [];
        return new HttpResponse(null, { status: 204 });
      },
    ),
  );
});

const renderSection = async ({
  permissions = MANAGER,
  serviceType = 'lodging' as ServiceType,
  active = true,
} = {}) => {
  server.use(sessionHandler(buildSession({ permissions })));
  renderWithProviders(
    <SessionGuard>
      <ServiceRatesSection
        service={{ id: 60, service_type: serviceType, is_active: active }}
      />
    </SessionGuard>,
  );
  await screen.findByText(/registrada/);
  return userEvent.setup();
};

async function fill(user: User, label: RegExp, text: string) {
  const field = screen.getByLabelText(label);
  await user.clear(field);
  await user.click(field);
  await user.paste(text);
}

async function fillNewRate(user: User) {
  await user.click(screen.getByRole('button', { name: /Agregar tarifa/ }));
  await fill(user, /Nombre de la tarifa/, 'Temporada media');
  await user.type(screen.getByLabelText(/Vigente desde/), '2027-01-16');
}

const saveRate = (user: User) =>
  user.click(screen.getByRole('button', { name: 'Guardar tarifa' }));

describe('agregar tarifa (HU-16 CA-01, CA-02, CA-05)', () => {
  it('envía el valor en pesos como cadena entera y avisa', async () => {
    const user = await renderSection();
    await fillNewRate(user);
    expect(screen.getByLabelText(/Valor por noche \(COP\)/)).toBeVisible();
    await fill(user, /Valor por noche/, '710.000');
    await fill(user, /Condiciones aplicables/, 'Mínimo 2 noches.');

    await saveRate(user);

    expect(await screen.findByText('Tarifa registrada.')).toBeVisible();
    expect(sent[0].body).toEqual({
      name: 'Temporada media',
      valid_from: '2027-01-16',
      valid_until: null,
      currency: 'COP',
      charge_unit: 'per_night',
      amount: '710000',
      conditions: 'Mínimo 2 noches.',
    });
    expect(
      screen.queryByRole('button', { name: 'Guardar tarifa' }),
    ).not.toBeInTheDocument();
  });

  it('en dólares la etiqueta lo dice y envía los centavos', async () => {
    const user = await renderSection();
    await fillNewRate(user);
    await user.selectOptions(screen.getByLabelText(/Moneda/), 'USD');
    await user.selectOptions(
      screen.getByLabelText(/Unidad de cobro/),
      'per_person_per_night',
    );
    await fill(user, /Valor por persona por noche \(USD\)/, '1.250,50');

    await saveRate(user);

    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0].body).toMatchObject({
      currency: 'USD',
      charge_unit: 'per_person_per_night',
      amount: '1250.50',
    });
  });

  it('pasar de dólares a pesos con centavos marca el valor sin redondear', async () => {
    const user = await renderSection();
    await fillNewRate(user);
    await user.selectOptions(screen.getByLabelText(/Moneda/), 'USD');
    await fill(user, /Valor por noche/, '1.250,50');

    await user.selectOptions(screen.getByLabelText(/Moneda/), 'COP');

    expect(
      await screen.findByText('En pesos el valor va sin decimales.'),
    ).toBeVisible();
    expect(screen.getByLabelText(/Valor por noche \(COP\)/)).toHaveValue(
      '1.250,50',
    );
    await saveRate(user);
    expect(sent).toHaveLength(0);
  });

  it('vacía o con la vigencia invertida no llama a la API', async () => {
    const user = await renderSection();
    await user.click(screen.getByRole('button', { name: /Agregar tarifa/ }));

    await saveRate(user);
    expect(
      await screen.findByText('Faltan 3 campos obligatorios.'),
    ).toBeVisible();

    await fill(user, /Nombre de la tarifa/, 'Temporada media');
    await user.type(screen.getByLabelText(/Vigente desde/), '2027-01-16');
    await user.type(screen.getByLabelText(/^Hasta/), '2027-01-10');
    await fill(user, /Valor por noche/, '560.000');
    await saveRate(user);

    expect(
      await screen.findByText(
        'La fecha final no puede ser anterior a la inicial.',
      ),
    ).toBeVisible();
    expect(sent).toHaveLength(0);
  });

  it('ofrece solo las unidades del tipo del servicio', async () => {
    const user = await renderSection({ serviceType: 'tours' });
    await user.click(screen.getByRole('button', { name: /Agregar tarifa/ }));

    const units = within(screen.getByLabelText(/Unidad de cobro/));
    expect(
      units.getAllByRole('option').map((option) => option.textContent),
    ).toEqual(['Por persona', 'Por grupo']);
    expect(screen.getByLabelText(/Valor por persona \(COP\)/)).toBeVisible();
  });

  it('con el servicio inactivo no ofrece agregar tarifas, pero sí editarlas', async () => {
    await renderSection({ active: false });

    expect(
      screen.getByText('Activa el servicio para agregarle tarifas.'),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: /Agregar tarifa/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Editar/ })).toBeVisible();
  });

  it('si desactivaron el servicio mientras se escribía, lo dice', async () => {
    server.use(
      http.post(apiUrl('/api/tourist-services/60/rates'), () =>
        HttpResponse.json(
          { detail: SERVICE_INACTIVE, code: 'service_inactive', fields: {} },
          { status: 409 },
        ),
      ),
    );
    const user = await renderSection();
    await fillNewRate(user);
    await fill(user, /Valor por noche/, '710.000');

    await saveRate(user);

    expect(await screen.findByText(SERVICE_INACTIVE)).toBeVisible();
    expect(screen.getByLabelText(/Nombre de la tarifa/)).toHaveValue(
      'Temporada media',
    );
  });
});

describe('editar y borrar tarifas (HU-16 CA-03)', () => {
  it('editar carga la tarifa y la envía con su versión', async () => {
    const user = await renderSection();
    await user.click(screen.getByRole('button', { name: /Editar/ }));

    expect(
      screen.getByRole('heading', { name: 'Editar tarifa' }),
    ).toBeVisible();
    expect(screen.getByLabelText(/Valor por noche/)).toHaveValue('710.000');
    await fill(user, /Valor por noche/, '750.000');
    await saveRate(user);

    expect(await screen.findByText('Tarifa actualizada.')).toBeVisible();
    expect(sent[0].body).toMatchObject({
      amount: '750000',
      expected_version: 1,
    });
  });

  it('si otra persona la cambió, avisa sin borrar lo escrito y recarga', async () => {
    server.use(
      http.put(apiUrl('/api/tourist-services/60/rates/80'), staleResponse),
    );
    const user = await renderSection();
    await user.click(screen.getByRole('button', { name: /Editar/ }));
    await fill(user, /Valor por noche/, '750.000');

    await saveRate(user);

    expect(await screen.findByText(STALE_MESSAGE)).toBeVisible();
    expect(screen.getByLabelText(/Valor por noche/)).toHaveValue('750.000');
    rates = [buildServiceRate({ amount: '800000', version: 2 })];
    await user.click(screen.getByRole('button', { name: 'Recargar' }));
    await waitFor(() =>
      expect(screen.getByLabelText(/Valor por noche/)).toHaveValue('800.000'),
    );
    expect(screen.queryByText(STALE_MESSAGE)).not.toBeInTheDocument();
  });

  it('borrar pide confirmación y envía la versión', async () => {
    const user = await renderSection();
    await user.click(screen.getByRole('button', { name: /Borrar/ }));

    const dialog = within(await screen.findByRole('alertdialog'));
    expect(
      dialog.getByText(
        'Se borrará la tarifa Temporada alta. Esta acción no se puede deshacer.',
      ),
    ).toBeVisible();
    await user.click(dialog.getByRole('button', { name: 'Borrar' }));

    expect(await screen.findByText('Tarifa borrada.')).toBeVisible();
    expect(sent[0].url.searchParams.get('expected_version')).toBe('1');
    expect(
      await screen.findByText('Este servicio aún no tiene tarifas.'),
    ).toBeVisible();
  });

  it('si la cambiaron antes de borrarla, avisa y recarga la tabla', async () => {
    server.use(
      http.delete(apiUrl('/api/tourist-services/60/rates/80'), staleResponse),
    );
    const user = await renderSection();
    await user.click(screen.getByRole('button', { name: /Borrar/ }));
    rates = [buildServiceRate({ name: 'Temporada alta 2027', version: 2 })];

    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Borrar',
      }),
    );

    expect(
      await screen.findByText(
        'Alguien cambió esta tarifa antes de borrarla. La tabla ya muestra la versión actual.',
      ),
    ).toBeVisible();
    // La fila nueva: sus botones llevan el nombre de la tarifa.
    expect(
      await screen.findByRole('button', { name: 'Borrar Temporada alta 2027' }),
    ).toBeVisible();
  });

  it('solo con "Ver" no ofrece agregar, editar ni borrar', async () => {
    await renderSection({
      permissions: ['suppliers.view', 'tourist_services.view'],
    });

    expect(screen.getByText('Temporada alta')).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

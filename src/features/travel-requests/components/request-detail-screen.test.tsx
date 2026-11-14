import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { clearPageNotice, setPageNotice } from '@/lib/page-notice';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';
import {
  buildClosedRequestDetail,
  buildTravelRequestDetail,
} from '@/test/travel-requests';

import type { TravelRequestDetail } from '../api';
import { RequestDetailScreen } from './request-detail-screen';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

const ALL = ['clients.view', 'travel_requests.view', 'travel_requests.manage'];

let detailRequests = 0;
let actions: { path: string; body: unknown }[] = [];

const serve = (request: TravelRequestDetail) =>
  server.use(
    http.get(apiUrl(`/api/travel-requests/${request.id}`), () => {
      detailRequests += 1;
      return HttpResponse.json(request);
    }),
  );

// Responde a cerrar o reabrir con la solicitud que se le dé, o con un error.
const respondToAction = (action: 'close' | 'reopen', respond: () => Response) =>
  server.use(
    http.post(
      apiUrl(`/api/travel-requests/231/${action}`),
      async ({ request }) => {
        actions.push({ path: action, body: await request.json() });
        return respond();
      },
    ),
  );

beforeEach(() => {
  detailRequests = 0;
  actions = [];
});

afterEach(() => {
  clearPageNotice();
});

const renderScreen = ({
  request = buildTravelRequestDetail(),
  permissions = ALL,
  id = String(request.id),
}: {
  request?: TravelRequestDetail;
  permissions?: string[];
  id?: string;
} = {}) => {
  serve(request);
  server.use(sessionHandler(buildSession({ permissions })));
  renderWithProviders(
    <SessionGuard>
      <RequestDetailScreen id={id} />
    </SessionGuard>,
  );
};

const valueOf = (term: string) =>
  screen.getByText(term, { selector: 'dt' }).nextElementSibling;

const heading = () =>
  screen.findByRole('heading', { name: 'Solicitud SOL-0231' });

describe('RequestDetailScreen', () => {
  it('muestra lo que se registró y quién la creó', async () => {
    renderScreen();

    expect(await heading()).toBeInTheDocument();
    expect(screen.getByText('San Andrés · 18–24 dic 2026')).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Marcela Gómez Ortiz' }),
    ).toHaveAttribute('href', '/clientes/7');
    expect(
      screen.getByText(/Creada el 10 de noviembre de 2026 por Andrés Peña/),
    ).toBeVisible();
    expect(valueOf('Destino')).toHaveTextContent('San Andrés');
    expect(valueOf('Origen')).toHaveTextContent('Cúcuta');
    expect(valueOf('Fechas')).toHaveTextContent('18–24 dic 2026');
    expect(valueOf('Viajeros')).toHaveTextContent('2 adultos · 1 menor');
    expect(valueOf('Presupuesto')).toHaveTextContent(
      /6\.000\.000.*8\.000\.000/,
    );
    expect(valueOf('Tipos de viaje')).toHaveTextContent('Familiar, Vacacional');
    expect(valueOf('Alojamiento')).toHaveTextContent('4 estrellas');
    expect(valueOf('Condiciones y observaciones')).toHaveTextContent(
      /cerca de la playa\.\s*Viajan con un coche/,
    );
    expect(valueOf('Estado')).toHaveTextContent('Nueva');
    expect(valueOf('Asesor responsable')).toHaveTextContent('Andrés Peña');
  });

  it('lo que no se dio se dice en vez de quedar en blanco', async () => {
    renderScreen({
      request: buildTravelRequestDetail({
        origin: null,
        budget_min: null,
        budget_max: null,
        trip_types: [],
        accommodation_category: null,
        notes: null,
      }),
    });

    await heading();
    expect(valueOf('Origen')).toHaveTextContent('—');
    expect(valueOf('Presupuesto')).toHaveTextContent('Sin presupuesto');
    expect(valueOf('Tipos de viaje')).toHaveTextContent('Sin preferencia');
    expect(valueOf('Alojamiento')).toHaveTextContent('Sin preferencia');
    expect(valueOf('Condiciones y observaciones')).toHaveTextContent('—');
  });

  it('marca al asesor responsable que ya está inactivo', async () => {
    renderScreen({
      request: buildTravelRequestDetail({
        assigned_to: { id: 9, full_name: 'Carlos Ibáñez', is_active: false },
      }),
    });

    await heading();
    expect(valueOf('Asesor responsable')).toHaveTextContent(
      'Carlos Ibáñez (inactivo)',
    );
  });

  it('una cerrada dice por qué y quién la cerró, y solo ofrece reabrir', async () => {
    renderScreen({ request: buildClosedRequestDetail() });

    await heading();
    expect(valueOf('Motivo de cierre')).toHaveTextContent(
      'Compró con otra agencia',
    );
    expect(valueOf('Nota de cierre')).toHaveTextContent(
      'Encontró un plan más barato.',
    );
    expect(valueOf('Cerrada')).toHaveTextContent(
      /Por Andrés Peña el 12 de noviembre de 2026/,
    );
    expect(screen.getByRole('button', { name: 'Reabrir' })).toBeVisible();
    expect(
      screen.queryByRole('link', { name: /Editar datos/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Cerrar solicitud' }),
    ).not.toBeInTheDocument();
  });

  it('sin gestionar no ofrece acciones, y sin ver clientes el nombre no es un enlace', async () => {
    renderScreen({ permissions: ['travel_requests.view'] });

    await heading();
    expect(screen.getByText('Marcela Gómez Ortiz')).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'Marcela Gómez Ortiz' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Editar datos/ })).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Cerrar solicitud' }),
    ).toBeNull();
  });

  it('muestra el aviso que deja el formulario', async () => {
    setPageNotice({
      target: 'travel-request:231',
      text: 'Solicitud registrada.',
    });
    renderScreen();

    expect(await screen.findByText('Solicitud registrada.')).toBeVisible();
  });

  it('un id que no existe dice que no la encontró', async () => {
    server.use(
      sessionHandler(buildSession({ permissions: ALL })),
      http.get(apiUrl('/api/travel-requests/999'), () =>
        HttpResponse.json(
          { code: 'not_found', detail: 'No encontrado.', fields: {} },
          { status: 404 },
        ),
      ),
    );
    renderWithProviders(
      <SessionGuard>
        <RequestDetailScreen id="999" />
      </SessionGuard>,
    );

    expect(
      await screen.findByText('No encontramos esta solicitud'),
    ).toBeInTheDocument();
  });
});

describe('RequestDetailScreen: cerrar y reabrir', () => {
  const openDialog = async () => {
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole('button', { name: 'Cerrar solicitud' }),
    );
    return { user, dialog: within(await screen.findByRole('alertdialog')) };
  };

  it('cerrar envía el motivo con la versión y avisa', async () => {
    respondToAction('close', () =>
      HttpResponse.json(buildClosedRequestDetail()),
    );
    renderScreen();
    const { user, dialog } = await openDialog();

    await user.click(
      dialog.getByRole('radio', { name: 'Compró con otra agencia' }),
    );
    await user.click(dialog.getByRole('button', { name: 'Cerrar solicitud' }));

    expect(await screen.findByText('Solicitud cerrada.')).toBeVisible();
    expect(actions).toEqual([
      {
        path: 'close',
        body: { reason: 'bought_elsewhere', note: null, expected_version: 1 },
      },
    ]);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('sin motivo, u "Otro" sin nota, no llama a la API', async () => {
    renderScreen();
    const { user, dialog } = await openDialog();

    await user.click(dialog.getByRole('button', { name: 'Cerrar solicitud' }));
    expect(await dialog.findByText('Elige el motivo.')).toBeVisible();

    await user.click(dialog.getByRole('radio', { name: 'Otro' }));
    await user.click(dialog.getByRole('button', { name: 'Cerrar solicitud' }));
    expect(await dialog.findByText('Cuéntanos el motivo.')).toBeVisible();
    expect(actions).toEqual([]);
  });

  it('si otra persona la cambió, avisa en el diálogo y recarga la ficha', async () => {
    respondToAction('close', () =>
      HttpResponse.json(
        {
          code: 'stale_version',
          detail:
            'Otra persona modificó este registro. Recarga para ver los cambios.',
          fields: {},
        },
        { status: 409 },
      ),
    );
    renderScreen();
    const { user, dialog } = await openDialog();
    const before = detailRequests;

    await user.click(dialog.getByRole('radio', { name: 'Solicitud repetida' }));
    await user.click(dialog.getByRole('button', { name: 'Cerrar solicitud' }));

    expect(
      await dialog.findByText(/Otra persona modificó este registro/),
    ).toBeVisible();
    await waitFor(() => expect(detailRequests).toBeGreaterThan(before));
  });

  it('reabrir envía la versión y avisa', async () => {
    respondToAction('reopen', () =>
      HttpResponse.json(buildTravelRequestDetail({ version: 3 })),
    );
    renderScreen({ request: buildClosedRequestDetail() });

    await userEvent
      .setup()
      .click(await screen.findByRole('button', { name: 'Reabrir' }));

    expect(await screen.findByText('Solicitud reabierta.')).toBeVisible();
    expect(actions).toEqual([
      { path: 'reopen', body: { expected_version: 2 } },
    ]);
  });

  it('si reabrir choca con otro cambio, muestra el motivo y recarga', async () => {
    respondToAction('reopen', () =>
      HttpResponse.json(
        {
          code: 'travel_request_not_closed',
          detail: 'La solicitud no está cerrada.',
          fields: {},
        },
        { status: 409 },
      ),
    );
    renderScreen({ request: buildClosedRequestDetail() });
    const before = detailRequests;

    await userEvent
      .setup()
      .click(await screen.findByRole('button', { name: 'Reabrir' }));

    expect(
      await screen.findByText('La solicitud no está cerrada.'),
    ).toBeVisible();
    await waitFor(() => expect(detailRequests).toBeGreaterThan(before));
  });
});
